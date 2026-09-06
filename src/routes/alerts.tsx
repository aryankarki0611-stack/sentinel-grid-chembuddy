import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/sentinel/AppShell";
import { Panel, RiskBadge, StatCard } from "@/components/sentinel/primitives";
import { AlertTriangle, BellRing, CheckCircle2, Radar } from "lucide-react";
import { ALERT_LABEL, formatDateTime, relativeTime } from "@/lib/sentinel/format";
import { getAlerts, getLocation } from "@/lib/sentinel/service";
import type { AlertStatus } from "@/lib/sentinel/types";

export const Route = createFileRoute("/alerts")({
  head: () => ({
    meta: [
      { title: "Alert Centre — SentinelGrid" },
      {
        name: "description",
        content:
          "Triage high-confidence detections, emerging hotspots, repeated activity, sensor disagreements and offline devices in one queue.",
      },
      { property: "og:title", content: "Alert Centre — SentinelGrid" },
      { property: "og:description", content: "Operational alert triage for the detection grid." },
    ],
  }),
  component: AlertsPage,
});

const FILTERS: (AlertStatus | "all")[] = ["all", "open", "acknowledged", "resolved"];

function AlertsPage() {
  const all = getAlerts();
  const [filter, setFilter] = useState<AlertStatus | "all">("all");
  const [overrides, setOverrides] = useState<Record<string, AlertStatus>>({});

  const rows = useMemo(
    () =>
      all
        .map((a) => ({ ...a, status: overrides[a.id] ?? a.status }))
        .filter((a) => filter === "all" || a.status === filter),
    [all, filter, overrides],
  );

  const open = all.filter((a) => (overrides[a.id] ?? a.status) === "open").length;
  const acknowledged = all.filter((a) => (overrides[a.id] ?? a.status) === "acknowledged").length;
  const resolved = all.filter((a) => (overrides[a.id] ?? a.status) === "resolved").length;

  return (
    <AppShell
      title="Alert Centre"
      subtitle="Automated signals raised by the grid · triage and acknowledge"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider transition-colors ${
                filter === f
                  ? "border-primary/60 bg-primary/15 text-primary"
                  : "border-border bg-surface text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Open" value={open} icon={BellRing} tone="danger" />
        <StatCard label="Acknowledged" value={acknowledged} icon={Radar} tone="warning" />
        <StatCard label="Resolved" value={resolved} icon={CheckCircle2} tone="success" />
        <StatCard label="Total signals" value={all.length} icon={AlertTriangle} />
      </div>

      <div className="mt-4 space-y-3">
        {rows.map((a) => (
          <Panel key={a.id} bodyClassName="p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{a.id}</span>
                  <RiskBadge level={a.severity} />
                  <span className="rounded border border-border bg-secondary/50 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {ALERT_LABEL[a.type]}
                  </span>
                  <span
                    className={`font-mono text-[10px] uppercase tracking-wider ${
                      a.status === "open"
                        ? "text-destructive"
                        : a.status === "acknowledged"
                          ? "text-warning"
                          : "text-success"
                    }`}
                  >
                    {a.status}
                  </span>
                </div>
                <p className="mt-2 text-sm">{a.reason}</p>
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                  {getLocation(a.location_id)?.zone} · {formatDateTime(a.created_at)} ·{" "}
                  {relativeTime(a.created_at)}
                  {a.device_id ? ` · ${a.device_id}` : ""}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {a.related_test_id && (
                  <Link
                    to="/tests/$testId"
                    params={{ testId: a.related_test_id }}
                    className="rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Related test {a.related_test_id}
                  </Link>
                )}
                {a.status !== "resolved" && (
                  <>
                    {a.status === "open" && (
                      <button
                        onClick={() => setOverrides((o) => ({ ...o, [a.id]: "acknowledged" }))}
                        className="rounded-md border border-warning/50 bg-warning/10 px-2.5 py-1.5 text-xs text-warning"
                      >
                        Acknowledge
                      </button>
                    )}
                    <button
                      onClick={() => setOverrides((o) => ({ ...o, [a.id]: "resolved" }))}
                      className="rounded-md border border-success/50 bg-success/10 px-2.5 py-1.5 text-xs text-success"
                    >
                      Resolve
                    </button>
                  </>
                )}
              </div>
            </div>
          </Panel>
        ))}
      </div>
    </AppShell>
  );
}
