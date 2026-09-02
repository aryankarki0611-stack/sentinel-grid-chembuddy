/**
 * Deterministic demonstration dataset for SentinelGrid.
 *
 * Everything here is synthetic. It is generated from a seeded PRNG anchored to
 * a fixed timestamp so server render and client hydration always agree.
 *
 * To move to real data, replace `src/lib/sentinel/service.ts` — nothing else
 * in the app imports this file directly.
 */
import type {
  Alert,
  AlertType,
  ChemBuddyAnalysis,
  CustodyEvent,
  DetectionEvent,
  Device,
  EvidenceReport,
  Location,
  ReasoningStep,
  RiskLevel,
  SensorReading,
  SubstanceCategory,
  Test,
  TestStatus,
  User,
} from "./types";

/** Fixed clock anchor for the demo dataset. */
export const ANCHOR = new Date("2026-09-02T09:00:00.000Z").getTime();
const HOUR = 3_600_000;

function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
const rnd = makeRng(20260902);
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rnd() * arr.length)]!;
const range = (min: number, max: number) => min + rnd() * (max - min);
const iso = (hoursAgo: number) => new Date(ANCHOR - hoursAgo * HOUR).toISOString();

export const currentUser: User = {
  id: "usr-001",
  badge_id: "CHD-4471",
  display_name: "Insp. A. Raghav",
  role: "supervisor",
  unit: "Narcotics Cell · Chandigarh",
  last_active_at: iso(0),
};

export const locations: Location[] = [
  { id: "loc-01", zone: "Sector 17 Plaza", district: "Central Chandigarh", lat: 30.7418, lng: 76.7827 },
  { id: "loc-02", zone: "Sector 22 Transit Hub", district: "Central Chandigarh", lat: 30.7355, lng: 76.7712 },
  { id: "loc-03", zone: "Sector 43 ISBT Perimeter", district: "South Chandigarh", lat: 30.7189, lng: 76.7566 },
  { id: "loc-04", zone: "Manimajra Corridor", district: "East Chandigarh", lat: 30.7266, lng: 76.8442 },
  { id: "loc-05", zone: "Sector 15 Campus Belt", district: "North Chandigarh", lat: 30.7594, lng: 76.7681 },
  { id: "loc-06", zone: "Industrial Area Phase II", district: "East Chandigarh", lat: 30.7059, lng: 76.8022 },
  { id: "loc-07", zone: "Sector 35 Market", district: "South Chandigarh", lat: 30.7259, lng: 76.7616 },
  { id: "loc-08", zone: "Dhanas Periphery", district: "North-West Chandigarh", lat: 30.7625, lng: 76.7362 },
];

export const devices: Device[] = [
  {
    id: "SG-D01",
    label: "Field Unit 01 — Primary Demonstrator",
    status: "online",
    battery_pct: 87,
    last_sync_at: iso(0.05),
    firmware_version: "1.4.2",
    tests_performed: 148,
    assigned_unit: "Narcotics Cell · Team Alpha",
    location_id: "loc-01",
    sensors: [
      {
        key: "as7341",
        name: "AS7341 11-Channel Spectral",
        type: "spectral",
        health: "nominal",
        current_reading: "415–680 nm · peak 0.82 rel @ 555 nm",
        calibrated_at: iso(36),
      },
      {
        key: "mq3",
        name: "MQ-Series Gas (MQ-3 / VOC)",
        type: "gas",
        health: "nominal",
        current_reading: "182 ppm-eq · baseline 96 ppm-eq",
        calibrated_at: iso(36),
      },
    ],
  },
  {
    id: "SG-D02",
    label: "Field Unit 02",
    status: "online",
    battery_pct: 62,
    last_sync_at: iso(0.4),
    firmware_version: "1.4.2",
    tests_performed: 96,
    assigned_unit: "Narcotics Cell · Team Bravo",
    location_id: "loc-03",
    sensors: [
      {
        key: "as7341",
        name: "AS7341 11-Channel Spectral",
        type: "spectral",
        health: "nominal",
        current_reading: "415–680 nm · peak 0.61 rel @ 480 nm",
        calibrated_at: iso(72),
      },
      {
        key: "mq3",
        name: "MQ-Series Gas (MQ-3 / VOC)",
        type: "gas",
        health: "degraded",
        current_reading: "241 ppm-eq · drift +11%",
        calibrated_at: iso(310),
      },
    ],
  },
  {
    id: "SG-D03",
    label: "Field Unit 03",
    status: "syncing",
    battery_pct: 41,
    last_sync_at: iso(2.2),
    firmware_version: "1.3.9",
    tests_performed: 73,
    assigned_unit: "Checkpoint · ISBT 43",
    location_id: "loc-04",
    sensors: [
      {
        key: "as7341",
        name: "AS7341 11-Channel Spectral",
        type: "spectral",
        health: "nominal",
        current_reading: "415–680 nm · peak 0.54 rel @ 590 nm",
        calibrated_at: iso(120),
      },
      {
        key: "mq3",
        name: "MQ-Series Gas (MQ-3 / VOC)",
        type: "gas",
        health: "nominal",
        current_reading: "118 ppm-eq · baseline 101 ppm-eq",
        calibrated_at: iso(120),
      },
    ],
  },
  {
    id: "SG-D04",
    label: "Field Unit 04",
    status: "offline",
    battery_pct: 8,
    last_sync_at: iso(19),
    firmware_version: "1.3.9",
    tests_performed: 54,
    assigned_unit: "Patrol · Manimajra",
    location_id: "loc-06",
    sensors: [
      {
        key: "as7341",
        name: "AS7341 11-Channel Spectral",
        type: "spectral",
        health: "fault",
        current_reading: "no telemetry",
        calibrated_at: iso(400),
      },
      {
        key: "mq3",
        name: "MQ-Series Gas (MQ-3 / VOC)",
        type: "gas",
        health: "fault",
        current_reading: "no telemetry",
        calibrated_at: iso(400),
      },
    ],
  },
  {
    id: "SG-D05",
    label: "Field Unit 05 — Lab Reference",
    status: "maintenance",
    battery_pct: 100,
    last_sync_at: iso(5.5),
    firmware_version: "1.5.0-rc1",
    tests_performed: 31,
    assigned_unit: "Forensic Lab · Sector 36",
    location_id: "loc-07",
    sensors: [
      {
        key: "as7341",
        name: "AS7341 11-Channel Spectral",
        type: "spectral",
        health: "nominal",
        current_reading: "calibration cycle in progress",
        calibrated_at: iso(3),
      },
      {
        key: "mq3",
        name: "MQ-Series Gas (MQ-3 / VOC)",
        type: "gas",
        health: "nominal",
        current_reading: "calibration cycle in progress",
        calibrated_at: iso(3),
      },
    ],
  },
];

const SPECTRAL_CHANNELS = [
  { channel: "F1", nm: 415 },
  { channel: "F2", nm: 445 },
  { channel: "F3", nm: 480 },
  { channel: "F4", nm: 515 },
  { channel: "F5", nm: 555 },
  { channel: "F6", nm: 590 },
  { channel: "F7", nm: 630 },
  { channel: "F8", nm: 680 },
  { channel: "NIR", nm: 910 },
];

const PROFILES: Record<
  Exclude<SubstanceCategory, "unknown">,
  { labels: string[]; peak: number; risk: RiskLevel; gas: number }
> = {
  opioid: { labels: ["Suspected Opioid (Heroin-class)", "Suspected Synthetic Opioid"], peak: 555, risk: "critical", gas: 210 },
  stimulant: { labels: ["Suspected Stimulant (Amphetamine-type)", "Suspected Cocaine-class"], peak: 480, risk: "high", gas: 265 },
  cannabinoid: { labels: ["Cannabinoid Residue", "Synthetic Cannabinoid Indicators"], peak: 630, risk: "moderate", gas: 148 },
  adulterant: { labels: ["Cutting Agent (Paracetamol-type)", "Caffeine Adulterant"], peak: 445, risk: "low", gas: 122 },
  precursor: { labels: ["Precursor Chemical Signature", "Solvent-class Precursor"], peak: 590, risk: "high", gas: 288 },
  benign: { labels: ["No Controlled Substance Detected", "Household Compound"], peak: 515, risk: "low", gas: 98 },
};

function spectralCurve(peakNm: number, noise: number) {
  return SPECTRAL_CHANNELS.map(({ channel, nm }) => {
    const reference = Number(Math.exp(-Math.pow(nm - peakNm, 2) / (2 * 95 * 95)).toFixed(3));
    const live = Number(Math.max(0.02, reference + (rnd() - 0.5) * noise).toFixed(3));
    return { channel, nm, live, reference };
  });
}

const CATEGORY_POOL: Exclude<SubstanceCategory, "unknown">[] = [
  "opioid",
  "opioid",
  "stimulant",
  "stimulant",
  "cannabinoid",
  "adulterant",
  "precursor",
  "benign",
];

function buildReasoning(
  agreement: number,
  confidence: number,
  inconclusive: boolean,
  peakNm: number,
): ReasoningStep[] {
  const steps: ReasoningStep[] = [
    {
      id: "r1",
      label: "Spectral response matched against reference library",
      detail: `Dominant absorbance near ${peakNm} nm aligns with the stored reference pattern (cosine similarity ${(0.7 + confidence * 0.28).toFixed(2)}).`,
      verdict: confidence > 0.6 ? "supports" : "neutral",
      weight: 0.34,
      elapsed_ms: 180,
    },
    {
      id: "r2",
      label: "Colour reaction curve evaluated",
      detail: "Reagent colour development rate compared with the expected kinetic profile over 90 s.",
      verdict: confidence > 0.55 ? "supports" : "neutral",
      weight: 0.22,
      elapsed_ms: 340,
    },
    {
      id: "r3",
      label: "Gas sensor signature cross-checked",
      detail: inconclusive
        ? "MQ-series volatile signature does not correspond to the spectral hypothesis — channels disagree."
        : "MQ-series volatile signature is consistent with the spectral hypothesis.",
      verdict: inconclusive ? "conflicts" : "supports",
      weight: 0.26,
      elapsed_ms: 520,
    },
    {
      id: "r4",
      label: "Cross-sensor consistency check",
      detail: `Sensor agreement scored at ${(agreement * 100).toFixed(0)}%. Threshold for a conclusive call is 70%.`,
      verdict: agreement >= 0.7 ? "supports" : "conflicts",
      weight: 0.18,
      elapsed_ms: 690,
    },
  ];
  return steps;
}

export const tests: Test[] = [];
export const sensorReadings: SensorReading[] = [];
export const analyses: ChemBuddyAnalysis[] = [];
export const evidenceReports: EvidenceReport[] = [];

const TOTAL_TESTS = 34;

for (let i = 0; i < TOTAL_TESTS; i++) {
  const idx = String(TOTAL_TESTS - i).padStart(4, "0");
  const testId = `TST-2026-${idx}`;
  const analysisId = `CBA-2026-${idx}`;
  const device = pick(devices.filter((d) => d.status !== "offline" || rnd() > 0.7));
  const location = pick(locations);
  const hoursAgo = Number((i * 3.4 + range(0, 2.5)).toFixed(2));
  const category = pick(CATEGORY_POOL);
  const profile = PROFILES[category];
  const label = pick(profile.labels);

  const inconclusive = rnd() < 0.18;
  const agreement = inconclusive ? range(0.32, 0.66) : range(0.78, 0.98);
  const baseConfidence = inconclusive ? range(0.38, 0.62) : range(0.72, 0.97);
  const confidence = Number(baseConfidence.toFixed(2));
  const status: TestStatus =
    inconclusive ? "inconclusive" : category === "benign" ? "negative" : "positive";
  const risk: RiskLevel =
    status !== "positive" ? (inconclusive ? "moderate" : "low") : confidence > 0.9 ? profile.risk : "moderate";

  const spectral = spectralCurve(profile.peak, inconclusive ? 0.34 : 0.09);
  const gasBaseline = 96;
  const gas = Number((inconclusive ? range(90, 130) : profile.gas + range(-18, 18)).toFixed(1));

  tests.push({
    id: testId,
    device_id: device.id,
    operator_id: currentUser.id,
    location_id: location.id,
    created_at: iso(hoursAgo),
    status,
    category,
    substance_label: label,
    confidence,
    risk_level: risk,
    sample_form: pick(["powder", "tablet", "liquid", "residue", "plant"] as const),
    analysis_id: analysisId,
  });

  sensorReadings.push({
    id: `SR-${idx}`,
    test_id: testId,
    device_id: device.id,
    captured_at: iso(hoursAgo),
    spectral,
    gas_ppm: gas,
    gas_baseline_ppm: gasBaseline,
    temperature_c: Number(range(24, 34).toFixed(1)),
    humidity_pct: Number(range(38, 72).toFixed(0)),
  });

  analyses.push({
    id: analysisId,
    test_id: testId,
    model_version: "chembuddy-v0.9.3",
    classification: inconclusive ? "INCONCLUSIVE — Laboratory confirmation recommended" : label,
    category: inconclusive ? "unknown" : category,
    confidence,
    sensor_agreement: Number(agreement.toFixed(2)),
    inconclusive,
    detected_features: [
      { name: "Primary absorbance peak", value: `${profile.peak} nm`, match: Number(range(0.7, 0.99).toFixed(2)) },
      { name: "Colour reaction slope", value: `${range(0.4, 1.6).toFixed(2)} ΔA/min`, match: Number(range(0.6, 0.97).toFixed(2)) },
      { name: "VOC signature", value: `${gas} ppm-eq`, match: Number((inconclusive ? range(0.2, 0.5) : range(0.7, 0.96)).toFixed(2)) },
      { name: "Baseline drift", value: `${range(0.2, 3.1).toFixed(1)}%`, match: Number(range(0.8, 0.99).toFixed(2)) },
    ],
    reasoning: buildReasoning(agreement, confidence, inconclusive, profile.peak),
    recommendation: inconclusive
      ? "Sensor channels disagree. Preserve the sample and forward it for laboratory confirmation before any operational action."
      : status === "negative"
        ? "No controlled substance indicated. Log the test and release the sample per standard procedure."
        : `Presumptive ${category} indication. Secure the sample, log chain of custody, and request confirmatory laboratory analysis.`,
    created_at: iso(hoursAgo),
  });

  const custody: CustodyEvent[] = [
    { id: "c1", at: iso(hoursAgo), actor: `Device ${device.id}`, action: "Sample captured", note: "Spectral + gas acquisition completed on device." },
    { id: "c2", at: iso(hoursAgo - 0.02), actor: "ChemBuddy v0.9.3", action: "Automated analysis", note: "Explainable classification generated." },
    { id: "c3", at: iso(hoursAgo - 0.05), actor: currentUser.badge_id, action: "Reviewed by operator", note: "Result acknowledged in the field." },
    { id: "c4", at: iso(hoursAgo - 0.2), actor: "SentinelGrid", action: "Event anonymized & published", note: "Location generalized to zone level before mapping." },
  ];

  evidenceReports.push({
    id: `EVR-2026-${idx}`,
    test_id: testId,
    reference_code: `CHD/NC/${idx}/2026`,
    generated_at: iso(hoursAgo - 0.2),
    generated_by: currentUser.badge_id,
    chain_of_custody: custody,
    disclaimer:
      "This report records a presumptive field screening result produced by an analytical aid. It is not a legal determination and does not replace accredited laboratory confirmation.",
  });
}

export const detectionEvents: DetectionEvent[] = tests.map((t) => ({
  id: `EVT-${t.id.slice(-4)}`,
  test_id: t.id,
  device_id: t.device_id,
  location_id: t.location_id,
  occurred_at: t.created_at,
  category: t.category,
  substance_label: t.substance_label,
  confidence: t.confidence,
  risk_level: t.risk_level,
  status: t.status,
}));

const ALERT_SPECS: { type: AlertType; severity: RiskLevel; reason: string; hoursAgo: number }[] = [
  { type: "high_confidence_detection", severity: "critical", reason: "Opioid-class detection at 96% confidence during a checkpoint screening.", hoursAgo: 0.6 },
  { type: "emerging_hotspot", severity: "high", reason: "Four positive detections within a 700 m radius over the last 12 hours.", hoursAgo: 2.1 },
  { type: "repeated_detections", severity: "high", reason: "Third stimulant-class positive from the same zone within 24 hours.", hoursAgo: 4.4 },
  { type: "sensor_disagreement", severity: "moderate", reason: "Spectral and gas channels disagree — result withheld pending laboratory confirmation.", hoursAgo: 6.9 },
  { type: "device_offline", severity: "moderate", reason: "SG-D04 has not synchronized for 19 hours and reports a critical battery level.", hoursAgo: 12.5 },
  { type: "unusual_pattern", severity: "low", reason: "Precursor-class signatures rising in an industrial zone with no prior history.", hoursAgo: 21 },
  { type: "high_confidence_detection", severity: "high", reason: "Synthetic opioid indicators detected near a transit hub at 92% confidence.", hoursAgo: 27 },
];

export const alerts: Alert[] = ALERT_SPECS.map((spec, i) => {
  const related = tests[i * 2] ?? tests[0]!;
  return {
    id: `ALR-${String(i + 1).padStart(3, "0")}`,
    type: spec.type,
    severity: spec.severity,
    created_at: iso(spec.hoursAgo),
    location_id: spec.type === "device_offline" ? "loc-06" : related.location_id,
    reason: spec.reason,
    status: i === 0 || i === 1 ? "open" : i < 4 ? "acknowledged" : "resolved",
    related_test_id: spec.type === "device_offline" ? null : related.id,
    device_id: spec.type === "device_offline" ? "SG-D04" : related.device_id,
  };
});
