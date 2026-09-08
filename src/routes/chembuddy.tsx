import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { AppShell } from "@/components/sentinel/AppShell";
import { ChemBuddyDetail } from "@/components/sentinel/ChemBuddyReport";
import { EmptyState, Panel, StatusBadge } from "@/components/sentinel/primitives";
import { relativeTime } from "@/lib/sentinel/format";
import {
  getAnalysisForTest,
  getCommandMetrics,
  getReadingForTest,
  getTests,
} from "@/lib/sentinel/service";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/chembuddy")({
  head: () => ({
    meta: [
      { title: "ChemBuddy Explainable AI — SentinelGrid" },
      {
        name: "description",
        content:
          "ChemBuddy shows the reasoning behind every classification: spectral match, colour reaction curve, gas signature, sensor agreement and a clear inconclusive state.",
      },
      { property: "og:title", content: "ChemBuddy Explainable AI — SentinelGrid" },
      {
        property: "og:description",
        content: "Reasoning trails, confidence and sensor agreement for every field screening.",
      },
    ],
  }),
  component: ChemBuddyPage,
});

function ChemBuddyPage() {
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

}, []);
useEffect(() => {
  const channel = supabase
    .channel("chembuddy-scans-realtime")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "scans",
      },
      (payload) => {
        console.log("ChemBuddy new scan:", payload.new);
        setLatestScan(payload.new);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
  const tests = getTests();
  const metrics = getCommandMetrics();
  const [testId, setTestId] = useState(tests[0]!.id);
  const test = tests.find((t) => t.id === testId)!;
  const analysis = getAnalysisForTest(testId);
const reading = getReadingForTest(testId);

const liveSpectral = latestScan?.spectral_reading;
const liveGas = latestScan?.gas_reading;

const liveConfidence =
  liveSpectral !== undefined
    ? Math.max(0, 100 - Math.abs(liveSpectral - 2500) / 50)
    : null;

const liveVerdict =
  liveConfidence !== null
    ? liveConfidence > 85 && liveGas > 1000
      ? "CONFIDENT MATCH: Target Detected"
      : liveConfidence > 50
        ? "INCONCLUSIVE: Send to Lab"
        : "NEGATIVE: No Match"
    : null;

  return (
    <AppShell
      title="ChemBuddy — Explainable Analysis"
      subtitle={`Model chembuddy-v0.9.3 · ${Math.round(metrics.inconclusiveRate * 100)}% of screenings withheld as inconclusive`}
    >
      <div className="grid gap-4 xl:grid-cols-[300px_1fr]">
        <Panel title="Analysis queue" hint="Select a screening" bodyClassName="p-0" className="max-h-[720px] overflow-auto">
          <ul className="divide-y divide-border">
            {tests.map((t) => (
              <li key={t.id}>
                <button
                  onClick={() => setTestId(t.id)}
                  className={cn(
                    "w-full px-4 py-3 text-left transition-colors hover:bg-secondary/40",
                    t.id === testId && "bg-primary/10",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{t.id}</span>
                    <StatusBadge status={t.status} />
                  </div>
                  <p className="mt-1 truncate text-sm">{t.substance_label}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                    {t.device_id} · {relativeTime(t.created_at)}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </Panel>

       {latestScan ? (
  <div className="space-y-4">
    <ChemBuddyDetail
  analysis={{
    ...analysis,
    category: analysis.category,
   confidence: liveConfidence !== null
  ? liveConfidence / 100
  : analysis.confidence,
    classification:
  liveVerdict === "CONFIDENT MATCH: Target Detected"
    ? "Target Detected"
    : liveVerdict === "INCONCLUSIVE: Send to Lab"
      ? "INCONCLUSIVE"
      : "No Controlled Substance Detected",
  }}
  reading={{
  ...reading,
  spectral_reading: latestScan.spectral_reading,
  gas_reading: latestScan.gas_reading,
  gas_ppm: latestScan.gas_reading,
}}
  test={test}
/>

    <Panel title="Live ChemBuddy Result" hint="Based on latest detector reading">
      <div className="space-y-3">
        <div>
          <p className="text-xs text-muted-foreground">VERDICT</p>
          <p className="mt-1 text-lg font-semibold">
            {liveVerdict ?? "Waiting for sensor data"}
          </p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">CONFIDENCE</p>
          <p className="mt-1 text-lg font-semibold">
            {liveConfidence !== null
              ? `${liveConfidence.toFixed(1)}%`
              : "—"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground">SPECTRAL</p>
            <p className="font-mono">
              {latestScan.spectral_reading}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">GAS</p>
            <p className="font-mono">
              {latestScan.gas_reading}
            </p>
          </div>
        </div>
      </div>
    </Panel>
  </div>
) : (
  <EmptyState message="Waiting for live detector data..." />
)}
      </div>
    </AppShell>
  );
}
