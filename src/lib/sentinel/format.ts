import { ANCHOR } from "./mock";
import type { AlertType, RiskLevel, SubstanceCategory, TestStatus } from "./types";

export const pct = (n: number) => `${Math.round(n * 100)}%`;

export function relativeTime(isoString: string) {
  const diff = ANCHOR - Date.parse(isoString);
  const mins = Math.max(1, Math.round(diff / 60_000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export function formatDateTime(isoString: string) {
  return new Date(isoString).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

export const CATEGORY_LABEL: Record<SubstanceCategory, string> = {
  opioid: "Opioid",
  stimulant: "Stimulant",
  cannabinoid: "Cannabinoid",
  adulterant: "Adulterant",
  precursor: "Precursor",
  benign: "Benign",
  unknown: "Unclassified",
};

export const RISK_LABEL: Record<RiskLevel, string> = {
  critical: "Critical",
  high: "High",
  moderate: "Moderate",
  low: "Low",
};

export const STATUS_LABEL: Record<TestStatus, string> = {
  positive: "Positive",
  negative: "Negative",
  inconclusive: "Inconclusive",
  processing: "Processing",
};

export const ALERT_LABEL: Record<AlertType, string> = {
  high_confidence_detection: "High-confidence detection",
  repeated_detections: "Repeated detections",
  emerging_hotspot: "Emerging hotspot",
  sensor_disagreement: "Sensor disagreement",
  device_offline: "Device offline",
  unusual_pattern: "Unusual pattern",
};

/** Tailwind token classes per risk level — no raw colors in components. */
export const riskClasses: Record<RiskLevel, string> = {
  critical: "border-destructive/50 bg-destructive/15 text-destructive",
  high: "border-warning/50 bg-warning/15 text-warning",
  moderate: "border-info/50 bg-info/15 text-info",
  low: "border-success/50 bg-success/15 text-success",
};

export const statusClasses: Record<TestStatus, string> = {
  positive: "border-destructive/50 bg-destructive/15 text-destructive",
  inconclusive: "border-warning/50 bg-warning/15 text-warning",
  negative: "border-success/50 bg-success/15 text-success",
  processing: "border-primary/50 bg-primary/15 text-primary",
};

export const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];
