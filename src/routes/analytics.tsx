import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/sentinel/AppShell";
import { Panel, StatCard } from "@/components/sentinel/primitives";
import { Gauge, HelpCircle, Percent, TrendingUp } from "lucide-react";
import { CATEGORY_LABEL, CHART_COLORS } from "@/lib/sentinel/format";
import {
  getCategoryDistribution,
  getCommandMetrics,
  getConfidenceDistribution,
  getDeviceUtilization,
  getHotspots,
  getTrendSeries,
} from "@/lib/sentinel/service";
import { supabase } from "../lib/supabaseClient";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — SentinelGrid" },
      {
        name: "description",
        content:
          "Detection trends, substance categories, geographic hotspots, device utilization, confidence distribution and inconclusive rate across the grid.",
      },
      { property: "og:title", content: "Analytics — SentinelGrid" },
      {
        property: "og:description",
        content:
          "Trend, hotspot and confidence analytics for the detection grid.",
      },
    ],
  }),
  component: AnalyticsPage,
});

const axis = {
  stroke: "var(--muted-foreground)",
  fontSize: 11,
  fontFamily: "var(--font-mono)",
};

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
};

function AnalyticsPage() {
  const [latestScan, setLatestScan] = useState<any>(null);
  const [scanCount, setScanCount] = useState(0);

  useEffect(() => {
    const loadLiveScans = async () => {
      const { data, error } = await supabase
        .from("scans")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setScanCount(data.length);

        if (data.length > 0) {
          setLatestScan(data[0]);
        }
      }
    };

    loadLiveScans();

    const channel = supabase
      .channel("analytics-scans-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "scans",
        },
        (payload) => {
          console.log("Analytics received new scan:", payload.new);

          setLatestScan(payload.new);
          setScanCount((current) => current + 1);
        },
      )
      .subscribe((status) => {
        console.log("Analytics realtime:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const metrics = getCommandMetrics();
  const trend = getTrendSeries(10);
  const categories = getCategoryDistribution();
  const confidence = getConfidenceDistribution();
  const hotspots = getHotspots().filter((h) => h.events > 0);
  const utilization = getDeviceUtilization();

  const radar = categories.map((c) => ({
    category: CATEGORY_LABEL[c.category],
    count: c.count,
  }));

  const liveConfidence =
    latestScan?.spectral_reading !== undefined
      ? Math.max(
          0,
          100 - Math.abs(latestScan.spectral_reading - 2500) / 50,
        )
      : null;

  return (
    <AppShell
      title="Analytics"
      subtitle="Aggregated, anonymized intelligence across the detection grid"
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Screenings analysed"
          value={metrics.totalTests}
          icon={TrendingUp}
        />

        <StatCard
          label="Positivity rate"
          value={`${Math.round(
            (metrics.positive / metrics.totalTests) * 100,
          )}%`}
          icon={Percent}
          tone="danger"
        />

        <StatCard
          label="Inconclusive rate"
          value={`${Math.round(metrics.inconclusiveRate * 100)}%`}
          icon={HelpCircle}
          tone="warning"
        />

        <StatCard
          label="Mean confidence"
          value={`${Math.round(metrics.avgConfidence * 100)}%`}
          icon={Gauge}
          tone="success"
        />
      </div>

      {latestScan && (
        <div className="mt-4">
          <Panel
            title="LIVE ANALYTICS SIGNAL"
            hint="Latest detector reading received from Supabase"
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="label-caps">Status</p>
                <p className="mt-1 text-sm font-semibold text-success">
                  LIVE
                </p>
              </div>

              <div>
                <p className="label-caps">Spectral reading</p>
                <p className="mt-1 font-mono text-sm">
                  {latestScan.spectral_reading}
                </p>
              </div>

              <div>
                <p className="label-caps">Gas reading</p>
                <p className="mt-1 font-mono text-sm">
                  {latestScan.gas_reading}
                </p>
              </div>

              <div>
                <p className="label-caps">Prototype confidence</p>
                <p className="mt-1 font-mono text-sm">
                  {liveConfidence !== null
                    ? `${Math.round(liveConfidence)}%`
                    : "—"}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-md border border-border bg-background/50 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">
                    Detector data connected
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {scanCount} live scan
                    {scanCount === 1 ? "" : "s"} available in Supabase.
                  </p>
                </div>

                <span className="rounded-md border border-primary/40 bg-primary/10 px-2 py-1 font-mono text-[10px] text-primary">
                  REALTIME
                </span>
              </div>
            </div>
          </Panel>
        </div>
      )}

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel
          title="Detection trend"
          hint="Rolling 10-day outcome volume"
          className="xl:col-span-2"
        >
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart
              data={trend}
              margin={{ top: 8, right: 8, bottom: 0, left: -22 }}
            >
              <defs>
                <linearGradient
                  id="posFill"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="var(--chart-4)"
                    stopOpacity={0.5}
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--chart-4)"
                    stopOpacity={0.04}
                  />
                </linearGradient>

                <linearGradient
                  id="incFill"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="var(--chart-3)"
                    stopOpacity={0.45}
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--chart-3)"
                    stopOpacity={0.04}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                stroke="var(--grid-line)"
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis
                dataKey="day"
                tick={axis}
                tickLine={false}
                axisLine={{ stroke: "var(--border)" }}
              />

              <YAxis
                tick={axis}
                tickLine={false}
                axisLine={{ stroke: "var(--border)" }}
                allowDecimals={false}
              />

              <Tooltip contentStyle={tooltipStyle} />

              <Legend
                wrapperStyle={{
                  fontSize: 11,
                  fontFamily: "var(--font-mono)",
                }}
              />

              <Area
                type="monotone"
                dataKey="positive"
                name="Positive"
                stroke="var(--chart-4)"
                fill="url(#posFill)"
                strokeWidth={2}
              />

              <Area
                type="monotone"
                dataKey="inconclusive"
                name="Inconclusive"
                stroke="var(--chart-3)"
                fill="url(#incFill)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        <Panel
          title="Confidence distribution"
          hint="Model certainty bands"
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={confidence}
              margin={{ top: 8, right: 8, bottom: 0, left: -22 }}
            >
              <CartesianGrid
                stroke="var(--grid-line)"
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis
                dataKey="band"
                tick={{ ...axis, fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: "var(--border)" }}
              />

              <YAxis
                tick={axis}
                tickLine={false}
                axisLine={{ stroke: "var(--border)" }}
                allowDecimals={false}
              />

              <Tooltip
                cursor={{
                  fill: "var(--secondary)",
                  opacity: 0.4,
                }}
                contentStyle={tooltipStyle}
              />

              <Bar
                dataKey="count"
                name="Screenings"
                fill="var(--chart-1)"
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel
          title="Substance categories"
          hint="Emerging pattern signature"
        >
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={radar} outerRadius={90}>
              <PolarGrid stroke="var(--grid-line)" />

              <PolarAngleAxis
                dataKey="category"
                tick={{ ...axis, fontSize: 10 }}
              />

              <Radar
                dataKey="count"
                stroke="var(--chart-1)"
                fill="var(--chart-1)"
                fillOpacity={0.28}
              />

              <Tooltip contentStyle={tooltipStyle} />
            </RadarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel
          title="Geographic hotspots"
          hint="Positive detections by zone"
          bodyClassName="p-0"
        >
          <ul className="divide-y divide-border">
            {hotspots.slice(0, 8).map((h) => (
              <li key={h.location.id} className="px-4 py-2.5">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate">{h.location.zone}</span>

                  <span className="font-mono text-xs">
                    {h.positives}/{h.events}
                  </span>
                </div>

                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-destructive"
                    style={{
                      width: `${h.intensity * 100}%`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          title="Device utilization"
          hint="Screenings in the current dataset"
        >
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={utilization}
                dataKey="tests"
                nameKey="device"
                innerRadius={50}
                outerRadius={88}
                paddingAngle={2}
                stroke="var(--background)"
              >
                {utilization.map((u, i) => (
                  <Cell
                    key={u.device}
                    fill={CHART_COLORS[i % CHART_COLORS.length]}
                  />
                ))}
              </Pie>

              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>

          <ul className="mt-2 space-y-1">
            {utilization.map((u, i) => (
              <li
                key={u.device}
                className="flex items-center justify-between text-xs text-muted-foreground"
              >
                <span className="flex items-center gap-2">
                  <span
                    className="size-2 rounded-full"
                    style={{
                      background:
                        CHART_COLORS[i % CHART_COLORS.length],
                    }}
                  />

                  {u.device}
                </span>

                <span className="font-mono">
                  {u.tests} · lifetime {u.lifetime}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </AppShell>
  );
}