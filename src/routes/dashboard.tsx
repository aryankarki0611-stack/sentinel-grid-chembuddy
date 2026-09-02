import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  Cpu,
  FlaskConical,
  HelpCircle,
  ShieldAlert,
} from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/sentinel/AppShell";
import { IntelMap } from "@/components/sentinel/IntelMap";
import { ConfidenceBar, Panel, RiskBadge, StatCard, StatusBadge } from "@/components/sentinel/primitives";
import { CATEGORY_LABEL, CHART_COLORS, relativeTime } from "@/lib/sentinel/format";
import {
  getAlerts,
  getCategoryDistribution,
  getCommandMetrics,
  getDevices,
  getEvents,
  getLocation,
  getLocations,
  getTests,
  getTrendSeries,
} from "@/lib/sentinel/service";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Command Centre — SentinelGrid" },
      {
        name: "description",
        content:
          "Live operational picture of chemical detection activity: tests, positive detections, device health, alerts and the citywide intelligence map.",
      },
      { property: "og:title", content: "Command Centre — SentinelGrid" },
      {
        property: "og:description",
        content: "What is happening right now, where, and how confident are we.",
      },
    ],
  }),
  component: DashboardPage,
});

const axis = { stroke: "var(--muted-foreground)", fontSize: 11, fontFamily: "var(--font-mono)" };

function DashboardPage() {
  const navigate = useNavigate();
  const metrics = getCommandMetrics();
  const tests = getTests();
  const events = getEvents().slice(0, 24);
  const devices = getDevices();
  const alerts = getAlerts().filter((a) => a.status !== "resolved").slice(0, 5);
  const trend = getTrendSeries(7);
  const categories = getCategoryDistribution();
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <AppShell
      title="SentinelGrid Command Centre"
      subtitle="Chandigarh operational grid · anonymized detection intelligence"
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total tests" value={metrics.totalTests} delta={`${metrics.last24h} in last 24h`} icon={FlaskConical} />
        <StatCard label="Positive detections" value={metrics.positive} delta={`avg confidence ${Math.round(metrics.avgConfidence * 100)}%`} icon={ShieldAlert} tone="danger" />
        <StatCard label="Inconclusive" value={metrics.inconclusive} delta={`${Math.round(metrics.inconclusiveRate * 100)}% of all tests`} icon={HelpCircle} tone="warning" />
        <StatCard label="Active devices" value={`${metrics.activeDevices}/${metrics.totalDevices}`} delta="fleet reporting" icon={Cpu} tone="success" />
        <StatCard label="High-risk alerts" value={metrics.highRiskAlerts} delta="requiring review" icon={AlertTriangle} tone="danger" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel
          title="Live city intelligence"
          hint="Anonymized detection events · zone-level precision"
          className="xl:col-span-2"
          bodyClassName="p-3"
          actions={
            <Link to="/map" className="label-caps text-primary hover:underline">
              Open full map
            </Link>
          }
        >
          <IntelMap
            events={events}
            locations={getLocations()}
            selectedId={selected}
            onSelect={(e) => {
              setSelected(e.id);
              navigate({ to: "/tests/$testId", params: { testId: e.test_id } });
            }}
            className="h-[380px]"
          />
        </Panel>

        <Panel title="Recent detection activity" hint="Newest field screenings" bodyClassName="p-0">
          <ul className="divide-y divide-border">
            {tests.slice(0, 7).map((t) => (
              <li key={t.id}>
                <Link
                  to="/tests/$testId"
                  params={{ testId: t.id }}
                  className="block px-4 py-3 transition-colors hover:bg-secondary/40"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{t.id}</span>
                    <StatusBadge status={t.status} />
                  </div>
                  <p className="mt-1 truncate text-sm">{t.substance_label}</p>
                  <div className="mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>{getLocation(t.location_id)?.zone}</span>
                    <span className="font-mono">{relativeTime(t.created_at)}</span>
                  </div>
                  <ConfidenceBar value={t.confidence} className="mt-2" />
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel title="Detection trend" hint="Last 7 days by outcome" className="xl:col-span-2">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={trend} margin={{ top: 8, right: 8, bottom: 0, left: -22 }}>
              <CartesianGrid stroke="var(--grid-line)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" tick={axis} tickLine={false} axisLine={{ stroke: "var(--border)" }} />
              <YAxis tick={axis} tickLine={false} axisLine={{ stroke: "var(--border)" }} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: "var(--secondary)", opacity: 0.4 }}
                contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: "var(--font-mono)" }} />
              <Bar dataKey="positive" name="Positive" stackId="a" fill="var(--chart-4)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="inconclusive" name="Inconclusive" stackId="a" fill="var(--chart-3)" />
              <Bar dataKey="negative" name="Negative" stackId="a" fill="var(--chart-5)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Substance categories" hint="Share of classified samples">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={categories}
                dataKey="count"
                nameKey="category"
                innerRadius={54}
                outerRadius={86}
                paddingAngle={2}
                stroke="var(--background)"
              >
                {categories.map((c, i) => (
                  <Cell key={c.category} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number, n: string) => [v, CATEGORY_LABEL[n as keyof typeof CATEGORY_LABEL] ?? n]}
                contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <ul className="mt-2 grid grid-cols-2 gap-1.5">
            {categories.map((c, i) => (
              <li key={c.category} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="size-2 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                {CATEGORY_LABEL[c.category]} · {c.count}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel title="Device status" hint="Portable detection fleet" bodyClassName="p-0" className="xl:col-span-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="label-caps border-b border-border">
                <th className="px-4 py-2 text-left font-normal">Device</th>
                <th className="px-4 py-2 text-left font-normal">Status</th>
                <th className="px-4 py-2 text-left font-normal">Battery</th>
                <th className="px-4 py-2 text-left font-normal">Last sync</th>
                <th className="px-4 py-2 text-left font-normal">Tests</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {devices.map((d) => (
                <tr key={d.id} className="transition-colors hover:bg-secondary/30">
                  <td className="px-4 py-2.5 font-mono text-xs">{d.id}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-flex items-center gap-1.5 font-mono text-[11px] uppercase ${
                        d.status === "online"
                          ? "text-success"
                          : d.status === "offline"
                            ? "text-destructive"
                            : "text-warning"
                      }`}
                    >
                      <Activity className="size-3" />
                      {d.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs">{d.battery_pct}%</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{relativeTime(d.last_sync_at)}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{d.tests_performed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel
          title="Active alerts"
          hint="Open and acknowledged"
          bodyClassName="p-0"
          actions={
            <Link to="/alerts" className="label-caps text-primary hover:underline">
              Alert centre
            </Link>
          }
        >
          <ul className="divide-y divide-border">
            {alerts.map((a) => (
              <li key={a.id} className="px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{a.id}</span>
                  <RiskBadge level={a.severity} />
                </div>
                <p className="mt-1 text-sm leading-snug">{a.reason}</p>
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                  {getLocation(a.location_id)?.zone} · {relativeTime(a.created_at)}
                </p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </AppShell>
  );
}
