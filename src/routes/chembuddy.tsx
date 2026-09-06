import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
  const tests = getTests();
  const metrics = getCommandMetrics();
  const [testId, setTestId] = useState(tests[0]!.id);
  const test = tests.find((t) => t.id === testId)!;
  const analysis = getAnalysisForTest(testId);
  const reading = getReadingForTest(testId);

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

        {analysis && reading ? (
          <ChemBuddyDetail analysis={analysis} reading={reading} test={test} />
        ) : (
          <EmptyState message="No analysis available for this screening." />
        )}
      </div>
    </AppShell>
  );
}
