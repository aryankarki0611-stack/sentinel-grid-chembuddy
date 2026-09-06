import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/sentinel/AppShell";
import { ConfidenceBar, Panel, RiskBadge, StatusBadge } from "@/components/sentinel/primitives";
import { CATEGORY_LABEL, formatDateTime } from "@/lib/sentinel/format";
import { getLocation, getTests } from "@/lib/sentinel/service";
import type { TestStatus } from "@/lib/sentinel/types";

export const Route = createFileRoute("/tests/")({
  head: () => ({
    meta: [
      { title: "Tests & Evidence — SentinelGrid" },
      {
        name: "description",
        content:
          "Searchable register of field screenings with classification, confidence, device, zone and links to full evidence records.",
      },
      { property: "og:title", content: "Tests & Evidence — SentinelGrid" },
      { property: "og:description", content: "Every field screening and its evidence record." },
    ],
  }),
  component: TestsPage,
});

const FILTERS: (TestStatus | "all")[] = ["all", "positive", "inconclusive", "negative"];

function TestsPage() {
  const tests = getTests();
  const [status, setStatus] = useState<TestStatus | "all">("all");
  const [query, setQuery] = useState("");

  const rows = useMemo(
    () =>
      tests.filter(
        (t) =>
          (status === "all" || t.status === status) &&
          (query === "" ||
            `${t.id} ${t.substance_label} ${t.device_id}`.toLowerCase().includes(query.toLowerCase())),
      ),
    [tests, status, query],
  );

  return (
    <AppShell
      title="Tests & Evidence"
      subtitle="Presumptive field screening register · analytical aid, not a legal determination"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search test ID, substance, device…"
            className="w-64 rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setStatus(f)}
              className={`rounded-md border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider transition-colors ${
                status === f
                  ? "border-primary/60 bg-primary/15 text-primary"
                  : "border-border bg-surface text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
          <span className="label-caps ml-auto">{rows.length} records</span>
        </div>
      }
    >
      <Panel bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="label-caps border-b border-border">
                <th className="px-4 py-2.5 text-left font-normal">Test ID</th>
                <th className="px-4 py-2.5 text-left font-normal">Classification</th>
                <th className="px-4 py-2.5 text-left font-normal">Category</th>
                <th className="px-4 py-2.5 text-left font-normal">Device</th>
                <th className="px-4 py-2.5 text-left font-normal">Zone</th>
                <th className="px-4 py-2.5 text-left font-normal">Confidence</th>
                <th className="px-4 py-2.5 text-left font-normal">Risk</th>
                <th className="px-4 py-2.5 text-left font-normal">Status</th>
                <th className="px-4 py-2.5 text-left font-normal">Recorded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((t) => (
                <tr key={t.id} className="transition-colors hover:bg-secondary/30">
                  <td className="px-4 py-2.5">
                    <Link to="/tests/$testId" params={{ testId: t.id }} className="font-mono text-xs text-primary hover:underline">
                      {t.id}
                    </Link>
                  </td>
                  <td className="max-w-[240px] truncate px-4 py-2.5">{t.substance_label}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{CATEGORY_LABEL[t.category]}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{t.device_id}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{getLocation(t.location_id)?.zone}</td>
                  <td className="w-40 px-4 py-2.5">
                    <ConfidenceBar value={t.confidence} />
                  </td>
                  <td className="px-4 py-2.5">
                    <RiskBadge level={t.risk_level} />
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 font-mono text-[11px] text-muted-foreground">
                    {formatDateTime(t.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </AppShell>
  );
}
