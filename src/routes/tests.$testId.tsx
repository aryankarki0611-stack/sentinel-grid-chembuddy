import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, FileDown, ShieldQuestion } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/sentinel/AppShell";
import { ChemBuddyDetail } from "@/components/sentinel/ChemBuddyReport";
import { EmptyState, Panel, RiskBadge, StatusBadge } from "@/components/sentinel/primitives";
import { CATEGORY_LABEL, formatDateTime } from "@/lib/sentinel/format";
import {
  getAnalysisForTest,
  getLocation,
  getReadingForTest,
  getReportForTest,
  getTest,
} from "@/lib/sentinel/service";

export const Route = createFileRoute("/tests/$testId")({
  head: () => ({
    meta: [
      { title: "Evidence Record — SentinelGrid" },
      {
        name: "description",
        content:
          "Full evidence record for a field screening: sensor readings, ChemBuddy reasoning, chain-of-custody timeline and report generation.",
      },
      { property: "og:title", content: "Evidence Record — SentinelGrid" },
      {
        property: "og:description",
        content: "Sensor data, explainable analysis and chain of custody for one screening.",
      },
    ],
  }),
  component: TestDetailPage,
});

function TestDetailPage() {
  const { testId } = useParams({ from: "/tests/$testId" });
  const test = getTest(testId);
  const analysis = test ? getAnalysisForTest(test.id) : undefined;
  const reading = test ? getReadingForTest(test.id) : undefined;
  const report = test ? getReportForTest(test.id) : undefined;
  const location = test ? getLocation(test.location_id) : undefined;

  if (!test || !analysis || !reading || !report) {
    return (
      <AppShell title="Evidence Record">
        <EmptyState message={`No record found for ${testId}.`} />
      </AppShell>
    );
  }

  return (
    <AppShell
      title={`Evidence Record · ${test.id}`}
      subtitle={`Reference ${report.reference_code} · presumptive field screening`}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/tests"
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" /> Back to register
          </Link>
          <button
            onClick={() =>
              toast.success("Evidence report queued", {
                description: `${report.reference_code} will be generated as a signed PDF and attached to the case file.`,
              })
            }
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
          >
            <FileDown className="size-3.5" /> Generate report
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <Panel title="Record summary">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <StatusBadge status={test.status} />
            <RiskBadge level={test.risk_level} />
            <span className="label-caps">Sample form · {test.sample_form}</span>
          </div>
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Test ID", test.id],
              ["Device ID", test.device_id],
              ["Timestamp (UTC)", formatDateTime(test.created_at)],
              ["Approximate location", `${location?.zone} · ${location?.district}`],
              ["Substance classification", test.substance_label],
              ["Category", CATEGORY_LABEL[test.category]],
              ["Confidence", `${Math.round(test.confidence * 100)}%`],
              ["Analysis ID", analysis.id],
            ].map(([k, v]) => (
              <div key={k} className="rounded-md border border-border bg-background/50 p-3">
                <dt className="label-caps">{k}</dt>
                <dd className="mt-1 text-sm">{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>

        <ChemBuddyDetail analysis={analysis} reading={reading} test={test} />

        <div className="grid gap-4 xl:grid-cols-2">
          <Panel title="Chain of custody" hint="Audit-friendly event history">
            <ol className="relative space-y-4 border-l border-border pl-6">
              {report.chain_of_custody.map((c) => (
                <li key={c.id} className="relative">
                  <span className="absolute -left-[27px] mt-1.5 size-2 rounded-full bg-primary" />
                  <div className="flex flex-wrap items-baseline gap-2">
                    <p className="text-sm font-medium">{c.action}</p>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {formatDateTime(c.at)} · {c.actor}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{c.note}</p>
                </li>
              ))}
            </ol>
          </Panel>

          <Panel title="Legal notice">
            <div className="flex gap-3 rounded-md border border-warning/40 bg-warning/10 p-4">
              <ShieldQuestion className="mt-0.5 size-4 shrink-0 text-warning" />
              <p className="text-sm leading-relaxed text-warning">{report.disclaimer}</p>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="label-caps">Report ID</dt>
                <dd className="mt-0.5 font-mono text-xs">{report.id}</dd>
              </div>
              <div>
                <dt className="label-caps">Generated by</dt>
                <dd className="mt-0.5 font-mono text-xs">{report.generated_by}</dd>
              </div>
              <div>
                <dt className="label-caps">Generated at</dt>
                <dd className="mt-0.5 font-mono text-xs">{formatDateTime(report.generated_at)}</dd>
              </div>
              <div>
                <dt className="label-caps">Model version</dt>
                <dd className="mt-0.5 font-mono text-xs">{analysis.model_version}</dd>
              </div>
            </dl>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
