/**
 * SentinelGrid domain model.
 *
 * These types mirror the database schema in `db/schema.sql` one-to-one so the
 * mock data layer can be swapped for Supabase (or a live device API) without
 * touching any UI code.
 *
 * Relationship chain:
 *   Device -> SensorReading -> Test -> ChemBuddyAnalysis -> EvidenceReport -> DetectionEvent
 */

export type UserRole = "officer" | "analyst" | "supervisor" | "admin";

export interface User {
  id: string;
  badge_id: string;
  display_name: string;
  role: UserRole;
  unit: string;
  /** No PII beyond what an authorized operator needs to be identified. */
  last_active_at: string;
}

export type DeviceStatus = "online" | "offline" | "maintenance" | "syncing";
export type SensorHealth = "nominal" | "degraded" | "fault";

export interface Device {
  id: string;
  label: string;
  status: DeviceStatus;
  battery_pct: number;
  last_sync_at: string;
  firmware_version: string;
  tests_performed: number;
  assigned_unit: string;
  location_id: string;
  sensors: DeviceSensor[];
}

export interface DeviceSensor {
  key: "as7341" | "mq3";
  name: string;
  type: "spectral" | "gas";
  health: SensorHealth;
  /** Human readable current reading, e.g. "412 nm · 0.68 rel." */
  current_reading: string;
  calibrated_at: string;
}

export interface Location {
  id: string;
  /** Coarse, anonymized zone label — never an exact address. */
  zone: string;
  district: string;
  /** Jittered to ~250 m so events cannot be traced to an individual. */
  lat: number;
  lng: number;
}

export type SubstanceCategory =
  | "opioid"
  | "stimulant"
  | "cannabinoid"
  | "adulterant"
  | "precursor"
  | "benign"
  | "unknown";

export type RiskLevel = "critical" | "high" | "moderate" | "low";
export type TestStatus = "positive" | "negative" | "inconclusive" | "processing";

export interface SensorReading {
  id: string;
  test_id: string;
  device_id: string;
  captured_at: string;
  /** AS7341 channel intensities keyed by nm band. */
  spectral: { channel: string; nm: number; live: number; reference: number }[];
  /** MQ-series gas sensor value in ppm-equivalent. */
  gas_ppm: number;
  gas_baseline_ppm: number;
  temperature_c: number;
  humidity_pct: number;
}

export interface Test {
  id: string;
  device_id: string;
  operator_id: string;
  location_id: string;
  created_at: string;
  status: TestStatus;
  category: SubstanceCategory;
  substance_label: string;
  confidence: number;
  risk_level: RiskLevel;
  sample_form: "powder" | "tablet" | "liquid" | "residue" | "plant";
  analysis_id: string;
}

export type ReasoningVerdict = "supports" | "conflicts" | "neutral";

export interface ReasoningStep {
  id: string;
  label: string;
  detail: string;
  verdict: ReasoningVerdict;
  weight: number;
  elapsed_ms: number;
}

export interface ChemBuddyAnalysis {
  id: string;
  test_id: string;
  model_version: string;
  classification: string;
  category: SubstanceCategory;
  confidence: number;
  /** 0-1 agreement between the spectral and gas sensor channels. */
  sensor_agreement: number;
  inconclusive: boolean;
  detected_features: { name: string; value: string; match: number }[];
  reasoning: ReasoningStep[];
  recommendation: string;
  created_at: string;
}

export interface EvidenceReport {
  id: string;
  test_id: string;
  reference_code: string;
  generated_at: string;
  generated_by: string;
  chain_of_custody: CustodyEvent[];
  disclaimer: string;
}

export interface CustodyEvent {
  id: string;
  at: string;
  actor: string;
  action: string;
  note: string;
}

export type AlertType =
  | "high_confidence_detection"
  | "repeated_detections"
  | "emerging_hotspot"
  | "sensor_disagreement"
  | "device_offline"
  | "unusual_pattern";

export type AlertStatus = "open" | "acknowledged" | "resolved";

export interface Alert {
  id: string;
  type: AlertType;
  severity: RiskLevel;
  created_at: string;
  location_id: string;
  reason: string;
  status: AlertStatus;
  related_test_id: string | null;
  device_id: string | null;
}

/** Anonymized, map-facing projection of a Test. Contains no operator identity. */
export interface DetectionEvent {
  id: string;
  test_id: string;
  device_id: string;
  location_id: string;
  occurred_at: string;
  category: SubstanceCategory;
  substance_label: string;
  confidence: number;
  risk_level: RiskLevel;
  status: TestStatus;
}

/** Payload accepted by POST /api/device/readings — the hardware contract. */
export interface DeviceReadingPayload {
  device_id: string;
  timestamp: string;
  spectral_readings: { channel: string; nm: number; value: number }[];
  gas_sensor_reading: number;
  battery: number;
  location: { lat: number; lng: number; zone?: string };
  firmware_version?: string;
}
