/**
 * Data access layer.
 *
 * Every page reads through this module. Today it resolves against the mock
 * dataset; swapping `provider` for a Supabase / REST implementation is the only
 * change required to run on live hardware data.
 */
import {
  alerts as mockAlerts,
  analyses as mockAnalyses,
  currentUser as mockUser,
  detectionEvents as mockEvents,
  devices as mockDevices,
  evidenceReports as mockReports,
  locations as mockLocations,
  sensorReadings as mockReadings,
  tests as mockTests,
} from "./mock";
import type {
  Alert,
  ChemBuddyAnalysis,
  DetectionEvent,
  Device,
  EvidenceReport,
  Location,
  SensorReading,
  SubstanceCategory,
  Test,
  User,
} from "./types";

export interface SentinelDataProvider {
  user: User;
  devices: Device[];
  locations: Location[];
  tests: Test[];
  readings: SensorReading[];
  analyses: ChemBuddyAnalysis[];
  reports: EvidenceReport[];
  alerts: Alert[];
  events: DetectionEvent[];
}

const mockProvider: SentinelDataProvider = {
  user: mockUser,
  devices: mockDevices,
  locations: mockLocations,
  tests: mockTests,
  readings: mockReadings,
  analyses: mockAnalyses,
  reports: mockReports,
  alerts: mockAlerts,
  events: mockEvents,
};

/** Swap this to point the whole app at a live backend. */
export const provider: SentinelDataProvider = mockProvider;

export const getUser = () => provider.user;
export const getDevices = () => provider.devices;
export const getDevice = (id: string) => provider.devices.find((d) => d.id === id);
export const getLocations = () => provider.locations;
export const getLocation = (id: string) => provider.locations.find((l) => l.id === id);
export const getTests = () =>
  [...provider.tests].sort((a, b) => b.created_at.localeCompare(a.created_at));
export const getTest = (id: string) => provider.tests.find((t) => t.id === id);
export const getReadingForTest = (testId: string) =>
  provider.readings.find((r) => r.test_id === testId);
export const getAnalysisForTest = (testId: string) =>
  provider.analyses.find((a) => a.test_id === testId);
export const getReportForTest = (testId: string) =>
  provider.reports.find((r) => r.test_id === testId);
export const getAlerts = () =>
  [...provider.alerts].sort((a, b) => b.created_at.localeCompare(a.created_at));
export const getEvents = () =>
  [...provider.events].sort((a, b) => b.occurred_at.localeCompare(a.occurred_at));

export interface CommandMetrics {
  totalTests: number;
  positive: number;
  inconclusive: number;
  negative: number;
  activeDevices: number;
  totalDevices: number;
  highRiskAlerts: number;
  avgConfidence: number;
  inconclusiveRate: number;
  last24h: number;
}

export function getCommandMetrics(): CommandMetrics {
  const tests = provider.tests;
  const positive = tests.filter((t) => t.status === "positive").length;
  const inconclusive = tests.filter((t) => t.status === "inconclusive").length;
  const negative = tests.filter((t) => t.status === "negative").length;
  const newest = Math.max(...tests.map((t) => Date.parse(t.created_at)));
  return {
    totalTests: tests.length,
    positive,
    inconclusive,
    negative,
    activeDevices: provider.devices.filter((d) => d.status === "online" || d.status === "syncing").length,
    totalDevices: provider.devices.length,
    highRiskAlerts: provider.alerts.filter(
      (a) => (a.severity === "critical" || a.severity === "high") && a.status !== "resolved",
    ).length,
    avgConfidence: tests.reduce((s, t) => s + t.confidence, 0) / tests.length,
    inconclusiveRate: inconclusive / tests.length,
    last24h: tests.filter((t) => newest - Date.parse(t.created_at) <= 24 * 3_600_000).length,
  };
}

/** Detections bucketed per day for trend charts. */
export function getTrendSeries(days = 7) {
  const tests = provider.tests;
  const newest = Math.max(...tests.map((t) => Date.parse(t.created_at)));
  const buckets: { day: string; positive: number; inconclusive: number; negative: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const end = newest - i * 86_400_000;
    const start = end - 86_400_000;
    const inWindow = tests.filter((t) => {
      const ts = Date.parse(t.created_at);
      return ts > start && ts <= end;
    });
    buckets.push({
      day: new Date(end).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
      positive: inWindow.filter((t) => t.status === "positive").length,
      inconclusive: inWindow.filter((t) => t.status === "inconclusive").length,
      negative: inWindow.filter((t) => t.status === "negative").length,
    });
  }
  return buckets;
}

export function getCategoryDistribution() {
  const counts = new Map<SubstanceCategory, number>();
  for (const t of provider.tests) counts.set(t.category, (counts.get(t.category) ?? 0) + 1);
  return [...counts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

export function getConfidenceDistribution() {
  const bands = [
    { band: "40–55%", min: 0, max: 0.55 },
    { band: "55–70%", min: 0.55, max: 0.7 },
    { band: "70–85%", min: 0.7, max: 0.85 },
    { band: "85–95%", min: 0.85, max: 0.95 },
    { band: "95–100%", min: 0.95, max: 1.01 },
  ];
  return bands.map((b) => ({
    band: b.band,
    count: provider.tests.filter((t) => t.confidence >= b.min && t.confidence < b.max).length,
  }));
}

export function getHotspots() {
  return provider.locations
    .map((loc) => {
      const events = provider.events.filter((e) => e.location_id === loc.id);
      const positives = events.filter((e) => e.status === "positive");
      return {
        location: loc,
        events: events.length,
        positives: positives.length,
        intensity: events.length === 0 ? 0 : positives.length / events.length,
        topCategory:
          getCategoryDistributionFor(events)[0]?.category ?? ("unknown" as SubstanceCategory),
      };
    })
    .sort((a, b) => b.positives - a.positives);
}

function getCategoryDistributionFor(events: DetectionEvent[]) {
  const counts = new Map<SubstanceCategory, number>();
  for (const e of events) counts.set(e.category, (counts.get(e.category) ?? 0) + 1);
  return [...counts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

export function getDeviceUtilization() {
  return provider.devices.map((d) => ({
    device: d.id,
    tests: provider.tests.filter((t) => t.device_id === d.id).length,
    lifetime: d.tests_performed,
    status: d.status,
  }));
}
