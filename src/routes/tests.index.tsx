import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/sentinel/AppShell";
import {
  ConfidenceBar,
  Panel,
  RiskBadge,
  StatusBadge,
} from "@/components/sentinel/primitives";
import { CATEGORY_LABEL, formatDateTime } from "@/lib/sentinel/format";
import { getLocation, getTests } from "@/lib/sentinel/service";
import type { TestStatus } from "@/lib/sentinel/types";
import { supabase } from "../lib/supabaseClient";

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
      {
        property: "og:description",
        content: "Every field screening and its evidence record.",
      },
    ],
  }),
  component: TestsPage,
});

const FILTERS: (TestStatus | "all")[] = [
  "all",
  "positive",
  "inconclusive",
  "negative",
];

function TestsPage() {
  const baseTests = getTests();

  const [status, setStatus] = useState<TestStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [latestScan, setLatestScan] = useState<any>(null);
  const [liveScanCount, setLiveScanCount] = useState(0);
  const [liveTests, setLiveTests] = useState<any[]>([]);

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

    const loadScans = async () => {
      const { data, error } = await supabase
        .from("scans")
        .select("*")
        .order("created_at", { ascending: false });

      if (error || !data) {
        console.error("Failed to load scans:", error);
        return;
      }

      setLiveScanCount(data.length);

      const convertedTests = data.map((scan: any) => {
        const spectral = Number(scan.spectral_reading ?? 0);
        const gas = Number(scan.gas_reading ?? 0);

        const confidence = Math.max(
          0,
          Math.min(100, 100 - Math.abs(spectral - 2500) / 50),
        );

        let testStatus: TestStatus;
        let substanceLabel: string;

        if (confidence > 85 && gas > 1000) {
          testStatus = "positive";
          substanceLabel = "Prototype Target Signature";
        } else if (confidence > 50) {
          testStatus = "inconclusive";
          substanceLabel = "Inconclusive Signal";
        } else {
          testStatus = "negative";
          substanceLabel = "No Reference Match";
        }

        return {
          id: `SCAN-${String(scan.id).slice(0, 8).toUpperCase()}`,
          test_id: scan.id,
          substance_label: substanceLabel,
          category: "unknown",
          device_id: "FIELD-DETECTOR-01",
          location_id: "live",
          confidence: confidence / 100,
          risk_level:
            confidence > 85 && gas > 1000
              ? "high"
              : confidence > 50
                ? "medium"
                : "low",
          status: testStatus,
          created_at: scan.created_at ?? scan.timestamp,
        };
      });

      setLiveTests(convertedTests);
    };

    loadLatestScan();
    loadScans();

    const channel = supabase
      .channel("tests-live-scans")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "scans",
        },
        (payload) => {
          const scan: any = payload.new;

          setLatestScan(scan);
          setLiveScanCount((count) => count + 1);

          const spectral = Number(scan.spectral_reading ?? 0);
          const gas = Number(scan.gas_reading ?? 0);

          const confidence = Math.max(
            0,
            Math.min(100, 100 - Math.abs(spectral - 2500) / 50),
          );

          let testStatus: TestStatus;
          let substanceLabel: string;

          if (confidence > 85 && gas > 1000) {
            testStatus = "positive";
            substanceLabel = "Prototype Target Signature";
          } else if (confidence > 50) {
            testStatus = "inconclusive";
            substanceLabel = "Inconclusive Signal";
          } else {
            testStatus = "negative";
            substanceLabel = "No Reference Match";
          }

          const newTest = {
            id: `SCAN-${String(scan.id).slice(0, 8).toUpperCase()}`,
            test_id: scan.id,
            substance_label: substanceLabel,
            category: "unknown",
            device_id: "FIELD-DETECTOR-01",
            location_id: "live",
            confidence: confidence / 100,
            risk_level:
              confidence > 85 && gas > 1000
                ? "high"
                : confidence > 50
                  ? "medium"
                  : "low",
            status: testStatus,
            created_at: scan.created_at ?? scan.timestamp,
          };

          setLiveTests((current) => [newTest, ...current]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const tests = useMemo(() => {
    const combined = [...liveTests, ...baseTests];

    return combined.filter((t) => {
      const matchesStatus =
        status === "all" || t.status === status;

      const searchText = query.trim().toLowerCase();

      const matchesQuery =
        !searchText ||
        String(t.id ?? "")
          .toLowerCase()
          .includes(searchText) ||
        String(t.test_id ?? "")
          .toLowerCase()
          .includes(searchText) ||
        String(t.substance_label ?? "")
          .toLowerCase()
          .includes(searchText) ||
        String(t.device_id ?? "")
          .toLowerCase()
          .includes(searchText);

      return matchesStatus && matchesQuery;
    });
  }, [baseTests, liveTests, query, status]);

  const positiveCount = liveTests.filter(
    (t) => t.status === "positive",
  ).length;

  const inconclusiveCount = liveTests.filter(
    (t) => t.status === "inconclusive",
  ).length;

  const liveSpectral =
    latestScan?.spectral_reading !== undefined
      ? Number(latestScan.spectral_reading)
      : null;

  const liveGas =
    latestScan?.gas_reading !== undefined
      ? Number(latestScan.gas_reading)
      : null;

  const liveConfidence =
    liveSpectral !== null
      ? Math.max(
          0,
          Math.min(
            100,
            100 - Math.abs(liveSpectral - 2500) / 50,
          ),
        )
      : null;

  return (
    <AppShell
      title="Tests & Evidence"
      subtitle="Field screening register and evidence records"
    >
      <div className="space-y-6">
        {/* LIVE DETECTOR SIGNAL */}
        <Panel
          title="LIVE DETECTOR SIGNAL"
          hint="Realtime readings from Supabase"
          bodyClassName="p-4"
        >
          {latestScan ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div>
                <p className="label-caps">SPECTRAL</p>
                <p className="mt-1 font-mono text-2xl font-semibold">
                  {liveSpectral}
                </p>
              </div>

              <div>
                <p className="label-caps">GAS</p>
                <p className="mt-1 font-mono text-2xl font-semibold">
                  {liveGas}
                </p>
              </div>

              <div>
                <p className="label-caps">PROTOTYPE CONFIDENCE</p>
                <p className="mt-1 font-mono text-2xl font-semibold">
                  {liveConfidence !== null
                    ? `${liveConfidence.toFixed(0)}%`
                    : "—"}
                </p>
              </div>

              <div>
                <p className="label-caps">SUPABASE SCANS</p>
                <p className="mt-1 font-mono text-2xl font-semibold">
                  {liveScanCount}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Waiting for detector data...
            </p>
          )}

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-md border border-border/60 bg-muted/20 p-3">
              <p className="label-caps">POSITIVE</p>
              <p className="mt-1 font-mono text-lg">
                {positiveCount}
              </p>
              <p className="text-xs text-muted-foreground">
                Live prototype classification
              </p>
            </div>

            <div className="rounded-md border border-border/60 bg-muted/20 p-3">
              <p className="label-caps">INCONCLUSIVE</p>
              <p className="mt-1 font-mono text-lg">
                {inconclusiveCount}
              </p>
              <p className="text-xs text-muted-foreground">
                Requires laboratory confirmation
              </p>
            </div>

            <div className="rounded-md border border-border/60 bg-muted/20 p-3">
              <p className="label-caps">DEVICE</p>
              <p className="mt-1 font-mono text-lg">
                FIELD-DETECTOR-01
              </p>
              <p className="text-xs text-muted-foreground">
                Realtime connection active
              </p>
            </div>
          </div>
        </Panel>

        {/* FILTERS */}
        <Panel
          title="SCREENING REGISTER"
          hint={`${tests.length} records`}
          bodyClassName="p-4"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setStatus(filter)}
                  className={`rounded-md border px-3 py-1.5 text-xs font-medium capitalize transition ${
                    status === filter
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tests, devices..."
              className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary md:w-72"
            />
          </div>
        </Panel>

        {/* TEST TABLE */}
        <Panel
          title="TESTS & EVIDENCE"
          hint="Each live scan is linked to its Supabase record"
          bodyClassName="p-0"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Test ID
                  </th>

                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Classification
                  </th>

                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Category
                  </th>

                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Device
                  </th>

                  <th className="w-40 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Confidence
                  </th>

                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Status
                  </th>

                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Risk
                  </th>

                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Time
                  </th>
                </tr>
              </thead>

              <tbody>
                {tests.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-10 text-center text-sm text-muted-foreground"
                    >
                      No matching test records found.
                    </td>
                  </tr>
                ) : (
                  tests.map((t: any) => (
                    <tr
                      key={`${t.test_id ?? t.id}-${t.created_at}`}
                      className="border-b border-border/60 transition hover:bg-muted/20"
                    >
                      <td className="px-4 py-2.5">
                        <Link
                          to="/tests/$testId"
                          params={{
                            testId: t.test_id ?? t.id,
                          }}
                          className="font-mono text-xs font-medium text-primary hover:underline"
                        >
                          {t.id}
                        </Link>
                      </td>

                      <td className="px-4 py-2.5">
                        <span className="text-sm font-medium">
                          {t.substance_label ?? "Unclassified"}
                        </span>
                      </td>

                      <td className="px-4 py-2.5">
                        <span className="text-sm text-muted-foreground">
                          {CATEGORY_LABEL[
                            t.category as keyof typeof CATEGORY_LABEL
                          ] ?? "Unclassified"}
                        </span>
                      </td>

                      <td className="px-4 py-2.5">
                        <span className="font-mono text-xs text-muted-foreground">
                          {t.device_id ?? "—"}
                        </span>
                      </td>

                      <td className="w-40 px-4 py-2.5">
                        <ConfidenceBar
                          value={Number(t.confidence ?? 0)}
                        />
                      </td>

                      <td className="px-4 py-2.5">
                        <StatusBadge
                          status={t.status as any}
                        />
                      </td>

                      <td className="px-4 py-2.5">
                        <RiskBadge
                          level={t.risk_level as any}
                        />
                      </td>

                      <td className="px-4 py-2.5">
                        <span className="whitespace-nowrap text-xs text-muted-foreground">
                          {t.created_at
                            ? formatDateTime(t.created_at)
                            : "—"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* PROTOTYPE NOTICE */}
        <div className="rounded-md border border-border/60 bg-muted/20 p-4 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">
            Prototype screening notice
          </p>
          <p className="mt-1">
            Detector values and classification logic are for demonstration
            of the SentinelGrid pipeline. Any real-world identification
            requires validated instrumentation and laboratory confirmation.
          </p>
        </div>
      </div>
    </AppShell>
  );
}