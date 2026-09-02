import { AlertTriangle, Check, CircleSlash, Minus } from "lucide-react";
import { SpectralChart } from "./SpectralChart";
import { ConfidenceBar, Panel } from "./primitives";
import { CATEGORY_LABEL, pct } from "@/lib/sentinel/format";
import type { ChemBuddyAnalysis, SensorReading, Test } from "@/lib/sentinel/types";
import { cn } from "@/lib/utils";

const verdictIcon = {
  supports: Check,
  conflicts: AlertTriangle,
  neutral: Minus,
};

const verdictClass = {
  supports: "text-success border-success/40 bg-success/10",
  conflicts: "text-destructive border-destructive/40 bg-destructive/10",
  neutral: "text-muted-foreground border-border bg-secondary/40",
};

export function ChemBuddyVerdict({
  analysis,
  test,
}: {
  analysis: ChemBuddyAnalysis;
  test: Test;
}) {
  const inconclusive = analysis.inconclusive;
  return (
    <div
      className={cn(
        "rounded-lg border p-5",
        inconclusive
          ? "border-warning/60 bg-warning/10"
          : test.status === "negative"
            ? "border-success/50 bg-success/8"
            : "border-destructive/60 bg-destructive/10",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="label-caps">Final classification</p>
          <h3
            className={cn(
              "mt-1 text-2xl font-semibold tracking-tight",
              inconclusive ? "text-warning" : test.status === "negative" ? "text-success" : "text-destructive",
            )}
          >
            {inconclusive ? "INCONCLUSIVE" : analysis.classification}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {inconclusive
              ? "Laboratory confirmation recommended — sensor channels disagree."
              : `Category: ${CATEGORY_LABEL[analysis.category]} · Model ${analysis.model_version}`}
          </p>
        </div>
        <div className="flex gap-6">
          <div>
            <p className="label-caps">Confidence</p>
            <p className="font-mono text-3xl leading-tight">{pct(analysis.confidence)}</p>
          </div>
          <div>
            <p className="label-caps">Sensor agreement</p>
            <p
              className={cn(
                "font-mono text-3xl leading-tight",
                analysis.sensor_agreement < 0.7 ? "text-warning" : "text-success",
              )}
            >
              {pct(analysis.sensor_agreement)}
            </p>
          </div>
        </div>
      </div>
      <ConfidenceBar value={analysis.confidence} className="mt-4" />
    </div>
  );
}

export function ReasoningTrail({ analysis }: { analysis: ChemBuddyAnalysis }) {
  return (
    <ol className="relative space-y-4 border-l border-border pl-6">
      {analysis.reasoning.map((step) => {
        const Icon = verdictIcon[step.verdict];
        return (
          <li key={step.id} className="relative">
            <span
              className={cn(
                "absolute -left-[31px] grid size-5 place-items-center rounded-full border",
                verdictClass[step.verdict],
              )}
            >
              <Icon className="size-3" />
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium">{step.label}</p>
              <span className="font-mono text-[10px] text-muted-foreground">
                +{step.elapsed_ms}ms · weight {step.weight.toFixed(2)}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{step.detail}</p>
          </li>
        );
      })}
    </ol>
  );
}

export function ChemBuddyDetail({
  analysis,
  reading,
  test,
}: {
  analysis: ChemBuddyAnalysis;
  reading: SensorReading;
  test: Test;
}) {
  return (
    <div className="space-y-4">
      <ChemBuddyVerdict analysis={analysis} test={test} />

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel
          title="Spectral comparison"
          hint="AS7341 live response vs. stored reference pattern"
          className="xl:col-span-2"
        >
          <SpectralChart reading={reading} />
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { k: "Gas (MQ)", v: `${reading.gas_ppm} ppm-eq` },
              { k: "Gas baseline", v: `${reading.gas_baseline_ppm} ppm-eq` },
              { k: "Temperature", v: `${reading.temperature_c} °C` },
              { k: "Humidity", v: `${reading.humidity_pct} %` },
            ].map((m) => (
              <div key={m.k} className="rounded-md border border-border bg-background/50 p-2.5">
                <p className="label-caps">{m.k}</p>
                <p className="mt-1 font-mono text-sm">{m.v}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Detected features">
          <ul className="space-y-3">
            {analysis.detected_features.map((f) => (
              <li key={f.name}>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm">{f.name}</p>
                  <span className="font-mono text-xs text-muted-foreground">{f.value}</span>
                </div>
                <ConfidenceBar value={f.match} className="mt-1.5" />
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Reasoning timeline" hint="Why ChemBuddy reached this conclusion">
          <ReasoningTrail analysis={analysis} />
        </Panel>
        <Panel title="Recommendation">
          <div className="flex gap-3 rounded-md border border-border bg-background/50 p-4">
            <CircleSlash className="mt-0.5 size-4 shrink-0 text-primary" />
            <p className="text-sm leading-relaxed">{analysis.recommendation}</p>
          </div>
          <p className="mt-3 rounded-md border border-warning/40 bg-warning/10 p-3 text-xs leading-relaxed text-warning">
            ChemBuddy is an analytical aid. Its output is a presumptive field indication and is not an
            automatic legal determination.
          </p>
        </Panel>
      </div>
    </div>
  );
}
