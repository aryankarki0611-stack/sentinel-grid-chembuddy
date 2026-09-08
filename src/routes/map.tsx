import { AppShell } from "@/components/sentinel/AppShell";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { createFileRoute, Link } from "@tanstack/react-router";
import { IntelMap } from "@/components/sentinel/IntelMap";
import { ConfidenceBar, EmptyState, Panel, RiskBadge, StatusBadge } from "@/components/sentinel/primitives";
import { CATEGORY_LABEL, formatDateTime, relativeTime } from "@/lib/sentinel/format";
import { getEvents, getHotspots, getLocation, getLocations } from "@/lib/sentinel/service";
import type { DetectionEvent, RiskLevel, SubstanceCategory } from "@/lib/sentinel/types";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "Live Intelligence Map — SentinelGrid" },
      {
        name: "description",
        content:
          "Anonymized citywide detection events plotted across Chandigarh with hotspot visualization, risk filters and event drill-down.",
      },
      { property: "og:title", content: "Live Intelligence Map — SentinelGrid" },
      {
        property: "og:description",
        content: "Hotspots, alert markers and filters over anonymized detection events.",
      },
    ],
  }),
  component: MapPage,
});

const CATEGORIES: (SubstanceCategory | "all")[] = [
  "all",
  "opioid",
  "stimulant",
  "cannabinoid",
  "adulterant",
  "precursor",
  "benign",
];
const RISKS: (RiskLevel | "all")[] = ["all", "critical", "high", "moderate", "low"];
const WINDOWS = [
  { key: "24h", label: "24 hours", hours: 24 },
  { key: "72h", label: "72 hours", hours: 72 },
  { key: "7d", label: "7 days", hours: 168 },
  { key: "all", label: "All", hours: 10_000 },
];

function Chip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider transition-colors ${
        active
          ? "border-primary/60 bg-primary/15 text-primary"
          : "border-border bg-surface text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function MapPage() {
  const [latestScan, setLatestScan] = useState<any>(null);

useEffect(() => {
  const loadLatestScan = async () => {
    const { data, error } = await supabase
      .from("scans")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!error && data) {
      setLatestScan(data);
    }
  };

  loadLatestScan();

  const channel = supabase
    .channel("map-scans")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "scans",
      },
      (payload) => {
        console.log("Map new scan:", payload.new);
        setLatestScan(payload.new);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
  const all = getEvents();
  const locations = getLocations();
  const hotspots = getHotspots();

  const [category, setCategory] = useState<SubstanceCategory | "all">("all");
  const [risk, setRisk] = useState<RiskLevel | "all">("all");
  const [windowKey, setWindowKey] = useState("7d");
  const [selected, setSelected] = useState<DetectionEvent | null>(null);

  const events = useMemo(() => {
    const hours = WINDOWS.find((w) => w.key === windowKey)?.hours ?? 168;
    const newest = Math.max(...all.map((e) => Date.parse(e.occurred_at)));
    return all.filter(
      (e) =>
        (category === "all" || e.category === category) &&
        (risk === "all" || e.risk_level === risk) &&
        newest - Date.parse(e.occurred_at) <= hours * 3_600_000,
    );
  }, [all, category, risk, windowKey]);

  return (
    <AppShell
      title="Live Intelligence Map"
      subtitle="Zone-level anonymized events · no personally identifying information is stored or displayed"
      actions={
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="label-caps mr-1">Category</span>
            {CATEGORIES.map((c) => (
              <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
                {c === "all" ? "All" : CATEGORY_LABEL[c]}
              </Chip>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="label-caps mr-1">Risk</span>
            {RISKS.map((r) => (
              <Chip key={r} active={risk === r} onClick={() => setRisk(r)}>
                {r}
              </Chip>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="label-caps mr-1">Window</span>
            {WINDOWS.map((w) => (
              <Chip key={w.key} active={windowKey === w.key} onClick={() => setWindowKey(w.key)}>
                {w.label}
              </Chip>
            ))}
          </div>
        </div>
      }
    >
      <div className="grid gap-4 xl:grid-cols-3">
        <Panel className="xl:col-span-2" bodyClassName="p-3">
          {latestScan && (
  <div className="mb-3 rounded-md border border-primary/40 bg-primary/5 p-3">
    <p className="label-caps">LIVE DETECTOR READING</p>
    <div className="mt-2 grid grid-cols-2 gap-3">
      <div>
        <p className="text-xs text-muted-foreground">Spectral</p>
        <p className="font-mono text-sm">{latestScan.spectral_reading}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Gas</p>
        <p className="font-mono text-sm">{latestScan.gas_reading}</p>
      </div>
    </div>
  </div>
)}
          <IntelMap
            events={events}
            locations={locations}
            selectedId={selected?.id ?? null}
            onSelect={setSelected}
            className="h-[540px]"
          />
        </Panel>

        <div className="space-y-4">
          <Panel title="Event detail" hint={selected ? selected.id : "Select a marker on the map"}>
            {selected ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <StatusBadge status={selected.status} />
                  <RiskBadge level={selected.risk_level} />
                </div>
                <h3 className="text-lg font-semibold leading-tight">{selected.substance_label}</h3>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    ["Category", CATEGORY_LABEL[selected.category]],
                    ["Device", selected.device_id],
                    ["Zone", getLocation(selected.location_id)?.zone ?? "—"],
                    ["District", getLocation(selected.location_id)?.district ?? "—"],
                    ["Occurred", formatDateTime(selected.occurred_at)],
                    ["Age", relativeTime(selected.occurred_at)],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt className="label-caps">{k}</dt>
                      <dd className="mt-0.5 font-mono text-xs">{v}</dd>
                    </div>
                  ))}
                </dl>
                <div>
                  <p className="label-caps">Confidence</p>
                  <ConfidenceBar value={selected.confidence} className="mt-1.5" />
                </div>
                <Link
                  to="/tests/$testId"
                  params={{ testId: selected.test_id }}
                  className="inline-flex w-full items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  Open evidence record
                </Link>
              </div>
            ) : (
              <EmptyState message="No event selected." />
            )}
          </Panel>

          <Panel title="Hotspots" hint="Ranked by positive detections" bodyClassName="p-0">
            <ul className="divide-y divide-border">
              {hotspots.slice(0, 6).map((h) => (
                <li key={h.location.id} className="px-4 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm">{h.location.zone}</p>
                    <span className="font-mono text-xs text-destructive">{h.positives}</span>
                  </div>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-destructive" style={{ width: `${h.intensity * 100}%` }} />
                  </div>
                  <p className="mt-1 label-caps">
                    {h.events} events · dominant {CATEGORY_LABEL[h.topCategory]}
                  </p>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
