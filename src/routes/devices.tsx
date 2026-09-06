import { createFileRoute } from "@tanstack/react-router";
import { BatteryCharging, Cpu, RadioTower, Waves } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/sentinel/AppShell";
import { Panel } from "@/components/sentinel/primitives";
import { SpectralChart } from "@/components/sentinel/SpectralChart";
import { formatDateTime, relativeTime } from "@/lib/sentinel/format";
import { getDevices, getLocation, getReadingForTest, getTests } from "@/lib/sentinel/service";
import type { DeviceStatus, SensorHealth } from "@/lib/sentinel/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/devices")({
  head: () => ({
    meta: [
      { title: "Device Monitoring — SentinelGrid" },
      {
        name: "description",
        content:
          "Fleet health for portable substance-detection devices: connectivity, battery, firmware, synchronization and AS7341 / MQ-series sensor status.",
      },
      { property: "og:title", content: "Device Monitoring — SentinelGrid" },
      {
        property: "og:description",
        content: "Live status of the SentinelGrid portable detection fleet.",
      },
    ],
  }),
  component: DevicesPage,
});

const statusClass: Record<DeviceStatus, string> = {
  online: "border-success/50 bg-success/12 text-success",
  offline: "border-destructive/50 bg-destructive/12 text-destructive",
  syncing: "border-primary/50 bg-primary/12 text-primary",
  maintenance: "border-warning/50 bg-warning/12 text-warning",
};

const healthClass: Record<SensorHealth, string> = {
  nominal: "text-success",
  degraded: "text-warning",
  fault: "text-destructive",
};

function DevicesPage() {
  const devices = getDevices();
  const tests = getTests();
  const [activeId, setActiveId] = useState(devices[0]?.id ?? "SG-D01");
  const active = devices.find((d) => d.id === activeId) ?? devices[0]!;
  const deviceTests = tests.filter((t) => t.device_id === active.id);
  const latestReading = deviceTests[0] ? getReadingForTest(deviceTests[0].id) : undefined;

  return (
    <AppShell
      title="Device Monitoring"
      subtitle="Portable detection fleet · telemetry received through /api/device/readings"
    >
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="space-y-3">
          {devices.map((d) => (
            <button
              key={d.id}
              onClick={() => setActiveId(d.id)}
              className={cn(
                "panel w-full p-4 text-left transition-colors",
                d.id === active.id ? "ring-1 ring-primary/60" : "hover:bg-secondary/30",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-sm">{d.id}</span>
                <span
                  className={cn(
                    "rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider",
                    statusClass[d.status],
                  )}
                >
                  {d.status}
                </span>
              </div>
              <p className="mt-1 truncate text-xs text-muted-foreground">{d.label}</p>
              <div className="mt-3 flex items-center gap-2">
                <BatteryCharging className="size-3.5 text-muted-foreground" />
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      d.battery_pct > 40 ? "bg-success" : d.battery_pct > 15 ? "bg-warning" : "bg-destructive",
                    )}
                    style={{ width: `${d.battery_pct}%` }}
                  />
                </div>
                <span className="font-mono text-[11px]">{d.battery_pct}%</span>
              </div>
              <p className="mt-2 label-caps">sync {relativeTime(d.last_sync_at)}</p>
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <Panel title={`${active.id} · ${active.label}`} hint={active.assigned_unit}>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {[
                { k: "Status", v: active.status, icon: RadioTower },
                { k: "Battery", v: `${active.battery_pct}%`, icon: BatteryCharging },
                { k: "Firmware", v: active.firmware_version, icon: Cpu },
                { k: "Tests performed", v: String(active.tests_performed), icon: Waves },
                { k: "Last sync", v: relativeTime(active.last_sync_at), icon: RadioTower },
              ].map((m) => (
                <div key={m.k} className="rounded-md border border-border bg-background/50 p-3">
                  <p className="label-caps">{m.k}</p>
                  <p className="mt-1 font-mono text-sm capitalize">{m.v}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Deployed zone: {getLocation(active.location_id)?.zone} ·{" "}
              {getLocation(active.location_id)?.district} · last synchronized{" "}
              {formatDateTime(active.last_sync_at)} UTC
            </p>
          </Panel>

          <div className="grid gap-4 md:grid-cols-2">
            {active.sensors.map((s) => (
              <Panel key={s.key} title={s.name} hint={s.type === "spectral" ? "Optical channel" : "Volatile channel"}>
                <div className="flex items-center justify-between">
                  <span className="label-caps">Health</span>
                  <span className={cn("font-mono text-xs uppercase", healthClass[s.health])}>{s.health}</span>
                </div>
                <p className="mt-3 rounded-md border border-border bg-background/50 p-3 font-mono text-sm">
                  {s.current_reading}
                </p>
                <p className="mt-2 label-caps">calibrated {relativeTime(s.calibrated_at)}</p>
              </Panel>
            ))}
          </div>

          {latestReading && (
            <Panel title="Latest capture" hint={`Spectral trace from ${deviceTests[0]?.id}`}>
              <SpectralChart reading={latestReading} height={220} />
            </Panel>
          )}

          <Panel title="Recent tests from this device" bodyClassName="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="label-caps border-b border-border">
                  <th className="px-4 py-2 text-left font-normal">Test</th>
                  <th className="px-4 py-2 text-left font-normal">Result</th>
                  <th className="px-4 py-2 text-left font-normal">Confidence</th>
                  <th className="px-4 py-2 text-left font-normal">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {deviceTests.slice(0, 8).map((t) => (
                  <tr key={t.id}>
                    <td className="px-4 py-2 font-mono text-xs">{t.id}</td>
                    <td className="px-4 py-2 text-xs">{t.substance_label}</td>
                    <td className="px-4 py-2 font-mono text-xs">{Math.round(t.confidence * 100)}%</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">{relativeTime(t.created_at)}</td>
                  </tr>
                ))}
                {deviceTests.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-sm text-muted-foreground">
                      No tests recorded for this device in the current window.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
