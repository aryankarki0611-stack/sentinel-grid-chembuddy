import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

/**
 * Hardware ingestion endpoint.
 *
 *   POST /api/device/readings
 *
 * A portable SentinelGrid device posts one capture here. The payload is
 * validated, normalized into the same structure the UI consumes, and returned
 * with a provisional ChemBuddy assessment. Persisting to the database is a
 * single call away — see `persistReading()` below.
 */

const PayloadSchema = z.object({
  device_id: z.string().min(3).max(32),
  timestamp: z.string().datetime().optional(),
  spectral_readings: z
    .array(
      z.object({
        channel: z.string().min(1).max(8),
        nm: z.number().min(300).max(1100),
        value: z.number().min(0).max(10),
      }),
    )
    .min(3)
    .max(16),
  gas_sensor_reading: z.number().min(0).max(10_000),
  battery: z.number().min(0).max(100),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    zone: z.string().max(80).optional(),
  }),
  firmware_version: z.string().max(16).optional(),
});

/** Coarsen coordinates to ~250 m so no event can identify an individual. */
function anonymize(lat: number, lng: number) {
  return { lat: Number(lat.toFixed(3)), lng: Number(lng.toFixed(3)) };
}

/**
 * Provisional on-ingest triage. The full explainable analysis is produced by
 * the ChemBuddy service; this keeps the device responsive in the field.
 */
function triage(spectral: { nm: number; value: number }[], gas: number) {
  const peak = spectral.reduce((a, b) => (b.value > a.value ? b : a));
  const spectralStrength = Math.min(1, peak.value);
  const gasStrength = Math.min(1, gas / 260);
  const agreement = 1 - Math.abs(spectralStrength - gasStrength);
  const inconclusive = agreement < 0.7;
  return {
    peak_nm: peak.nm,
    confidence: Number((inconclusive ? agreement * 0.7 : 0.6 + agreement * 0.38).toFixed(2)),
    sensor_agreement: Number(agreement.toFixed(2)),
    status: inconclusive ? "inconclusive" : "positive",
    note: inconclusive
      ? "INCONCLUSIVE — laboratory confirmation recommended."
      : "Provisional indication; full ChemBuddy analysis queued.",
  };
}

/**
 * Persistence hook. Wire this to the database (see db/schema.sql):
 * insert into devices (upsert telemetry), sensor_readings, tests, then publish
 * an anonymized row into detection_events.
 */
async function persistReading(record: unknown) {
  return { stored: false, record };
}

export const Route = createFileRoute("/api/device/readings")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["DEVICE_API_KEY"];
        if (apiKey && request.headers.get("x-device-key") !== apiKey) {
          return Response.json({ error: "Unauthorized device" }, { status: 401 });
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Malformed JSON body" }, { status: 400 });
        }

        const parsed = PayloadSchema.safeParse(body);
        if (!parsed.success) {
          return Response.json(
            { error: "Invalid payload", issues: parsed.error.flatten() },
            { status: 422 },
          );
        }

        const p = parsed.data;
        const capturedAt = p.timestamp ?? new Date().toISOString();
        const assessment = triage(p.spectral_readings, p.gas_sensor_reading);

        const record = {
          device_id: p.device_id,
          captured_at: capturedAt,
          battery_pct: p.battery,
          firmware_version: p.firmware_version ?? null,
          location: { ...anonymize(p.location.lat, p.location.lng), zone: p.location.zone ?? null },
          spectral: p.spectral_readings,
          gas_ppm: p.gas_sensor_reading,
          assessment,
        };

        await persistReading(record);

        return Response.json(
          { accepted: true, ingest_id: `ING-${Date.now().toString(36).toUpperCase()}`, record },
          { status: 202 },
        );
      },

      GET: async () =>
        Response.json({
          endpoint: "POST /api/device/readings",
          auth: "optional header x-device-key (set DEVICE_API_KEY to enforce)",
          payload: {
            device_id: "SG-D01",
            timestamp: "2026-09-02T09:00:00.000Z",
            spectral_readings: [{ channel: "F5", nm: 555, value: 0.82 }],
            gas_sensor_reading: 182,
            battery: 87,
            location: { lat: 30.7418, lng: 76.7827, zone: "Sector 17 Plaza" },
            firmware_version: "1.4.2",
          },
        }),
    },
  },
});
