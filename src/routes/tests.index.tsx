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
import { getTests } from "@/lib/sentinel/service";
import type { TestStatus } from "@/lib/sentinel/types";

import { supabase } from "../lib/supabaseClient";
import { loadCSVReports } from "../lib/csvReports";

export const Route = createFileRoute("/tests/")({
  component: TestsPage,
});

function TestsPage() {
  const baseTests = getTests();

  const [status, setStatus] = useState<TestStatus | "all">("all");
  const [query, setQuery] = useState("");

  const [latestScan, setLatestScan] = useState<any>(null);
  const [liveScanCount, setLiveScanCount] = useState(0);
  const [liveTests, setLiveTests] = useState<any[]>([]);
  const [csvTests, setCsvTests] = useState<any[]>([]);

  /* ---------------------------------------------------------
     LOAD CSV REFERENCE REPORTS
  --------------------------------------------------------- */
  useEffect(() => {
    loadCSVReports().then((reports) => {
      console.log("CSV reports loaded:", reports);

      const convertedCSVTests = reports.map((report, index) => {
        const rawConfidence = Number(report.confidence) || 0;

        // Support both:
        // 0.95  -> 95%
        // 95    -> 95%
        const confidencePercent =
          rawConfidence <= 1
            ? rawConfidence * 100
            : rawConfidence;

        const confidence = Math.max(
          0,
          Math.min(100, confidencePercent),
        );

        const statusText = String(
          report.status ?? "",
        ).toLowerCase();

        const statusValue =
          statusText.includes("positive") ||
          statusText.includes("detected") ||
          statusText.includes("match")
            ? "positive"
            : statusText.includes("inconclusive") ||
                statusText.includes("uncertain")
              ? "inconclusive"
              : "negative";

        return {
          id: `CSV-${String(index + 1).padStart(3, "0")}`,

          test_id: `CSV-${String(index + 1).padStart(3, "0")}`,

          substance_label:
            report.substance_label ||
            "Reference Record",

          category:
            report.category ||
            "unknown",

          device_id:
            report.device_id ||
            "CSV-REFERENCE",

          location_id:
            report.location_id ||
            "reference",

          // Store confidence as 0–1 because
          // ConfidenceBar expects that format.
          confidence: confidence / 100,

          risk_level:
            report.risk_level ||
            "low",

          status:
            statusValue as TestStatus,

          created_at:
            report.captured_at,

          source: "CSV",
        };
      });

      console.log(
        "Converted CSV tests:",
        convertedCSVTests,
      );

      setCsvTests(convertedCSVTests);
    });
  }, []);

  /* ---------------------------------------------------------
     LOAD SUPABASE SCANS
  --------------------------------------------------------- */
  useEffect(() => {
    const loadScans = async () => {
      const { data, error, count } = await supabase
        .from("scans")
        .select("*", { count: "exact" })
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error(
          "Failed to load scans:",
          error,
        );
        return;
      }

      const scans = data ?? [];

      setLiveScanCount(
        count ?? scans.length,
      );

      if (scans.length > 0) {
        setLatestScan(scans[0]);
      }

      const convertedTests = scans.map(
        (scan: any) => {
          const spectral = Number(
            scan["spectral_reading"] ?? 0,
          );

          const gas = Number(
            scan["gas_reading"] ?? 0,
          );

          const confidence = Math.max(
            0,
            Math.min(
              100,
              100 -
                Math.abs(
                  spectral - 2500,
                ) /
                  50,
            ),
          );

          const isMatch =
            confidence > 85 &&
            gas > 1000;

          const isInconclusive =
            confidence > 50 &&
            !isMatch;

          const testStatus: TestStatus =
            isMatch
              ? "positive"
              : isInconclusive
                ? "inconclusive"
                : "negative";

          return {
            id: scan["id"],
            test_id: scan["id"],

            substance_label: isMatch
              ? "Prototype Target Signature"
              : isInconclusive
                ? "Inconclusive Signal"
                : "No Reference Match",

            category:
              "unknown",

            device_id:
              "FIELD-DETECTOR-01",

            location_id:
              "field",

            confidence:
              confidence / 100,

            risk_level:
              isMatch
                ? "high"
                : "low",

            status:
              testStatus,

            created_at:
              scan["created_at"] ??
              scan["timestamp"],

            source: "SUPABASE",
          };
        },
      );

      setLiveTests(convertedTests);
    };

    loadScans();

    /* -------------------------------------------------------
       REALTIME SUPABASE SCANS
    ------------------------------------------------------- */
    const channel = supabase
      .channel("tests-page-scans")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "scans",
        },
        (payload) => {
          const newScan: any =
            payload.new;

          const spectral = Number(
            newScan?.["spectral_reading"] ??
              0,
          );

          const gas = Number(
            newScan?.["gas_reading"] ??
              0,
          );

          const confidence = Math.max(
            0,
            Math.min(
              100,
              100 -
                Math.abs(
                  spectral - 2500,
                ) /
                  50,
            ),
          );

          const isMatch =
            confidence > 85 &&
            gas > 1000;

          const isInconclusive =
            confidence > 50 &&
            !isMatch;

          const testStatus: TestStatus =
            isMatch
              ? "positive"
              : isInconclusive
                ? "inconclusive"
                : "negative";

          const newTest = {
            id:
              newScan?.["id"],

            test_id:
              newScan?.["id"],

            substance_label:
              isMatch
                ? "Prototype Target Signature"
                : isInconclusive
                  ? "Inconclusive Signal"
                  : "No Reference Match",

            category:
              "unknown",

            device_id:
              "FIELD-DETECTOR-01",

            location_id:
              "field",

            confidence:
              confidence / 100,

            risk_level:
              isMatch
                ? "high"
                : "low",

            status:
              testStatus,

            created_at:
              newScan?.["created_at"] ??
              newScan?.["timestamp"],

            source:
              "SUPABASE",
          };

          setLatestScan(
            newScan,
          );

          setLiveTests(
            (current) => [
              newTest,
              ...current,
            ],
          );

          setLiveScanCount(
            (current) =>
              current + 1,
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(
        channel,
      );
    };
  }, []);

  /* ---------------------------------------------------------
     COMBINE ALL TEST SOURCES
  --------------------------------------------------------- */
  const combined = useMemo(() => {
    return [
      ...liveTests,
      ...csvTests,
      ...baseTests,
    ];
  }, [
    baseTests,
    liveTests,
    csvTests,
  ]);

  /* ---------------------------------------------------------
     FILTER TESTS
  --------------------------------------------------------- */
  const filteredTests =
    useMemo(() => {
      const normalizedQuery =
        query
          .trim()
          .toLowerCase();

      return combined.filter(
        (test: any) => {
          const matchesStatus =
            status === "all" ||
            test.status ===
              status;

          const searchableText =
            [
              test.id,
              test.test_id,
              test.substance_label,
              test.category,
              test.device_id,
              test.location_id,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

          const matchesQuery =
            !normalizedQuery ||
            searchableText.includes(
              normalizedQuery,
            );

          return (
            matchesStatus &&
            matchesQuery
          );
        },
      );
    }, [
      combined,
      query,
      status,
    ]);

  /* ---------------------------------------------------------
     LIVE SUMMARY
  --------------------------------------------------------- */
  const positiveCount =
    liveTests.filter(
      (test) =>
        test.status ===
        "positive",
    ).length;

  const inconclusiveCount =
    liveTests.filter(
      (test) =>
        test.status ===
        "inconclusive",
    ).length;

  const liveSpectral =
    latestScan?.[
      "spectral_reading"
    ];

  const liveGas =
    latestScan?.[
      "gas_reading"
    ];

  const liveConfidence =
    liveSpectral !==
    undefined
      ? Math.max(
          0,
          Math.min(
            100,
            100 -
              Math.abs(
                Number(
                  liveSpectral,
                ) - 2500,
              ) /
                50,
          ),
        )
      : null;

  return (
    <AppShell
  title="Tests & Evidence"
  subtitle="Live detector scans and CSV reference reports"
>
      <div className="space-y-6">
        {/* ---------------------------------------------------
            HEADER
        --------------------------------------------------- */}
        <div>
          <p className="label-caps">
            Field screening register
            and evidence records
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Tests & Evidence
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Live detector scans and
            CSV reference reports
          </p>
        </div>

        {/* ---------------------------------------------------
            LIVE DETECTOR
        --------------------------------------------------- */}
        <Panel>
          <div className="flex items-center justify-between">
            <div>
              <p className="label-caps">
                Live detector signal
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Realtime readings from
                Supabase
              </p>
            </div>

            <div className="text-xs text-muted-foreground">
              LIVE
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-4">
            <div>
              <p className="label-caps">
                Spectral
              </p>

              <p className="mt-2 font-mono text-2xl font-semibold">
                {liveSpectral ??
                  "—"}
              </p>
            </div>

            <div>
              <p className="label-caps">
                Gas
              </p>

              <p className="mt-2 font-mono text-2xl font-semibold">
                {liveGas ??
                  "—"}
              </p>
            </div>

            <div>
              <p className="label-caps">
                Prototype confidence
              </p>

              <p className="mt-2 font-mono text-2xl font-semibold">
                {liveConfidence !==
                null
                  ? `${Math.round(
                      liveConfidence,
                    )}%`
                  : "—"}
              </p>
            </div>

            <div>
              <p className="label-caps">
                Supabase scans
              </p>

              <p className="mt-2 font-mono text-2xl font-semibold">
                {liveScanCount}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div>
              <p className="label-caps">
                Positive
              </p>

              <p className="mt-1 text-lg font-semibold">
                {positiveCount}
              </p>

              <p className="text-xs text-muted-foreground">
                Live prototype
                classification
              </p>
            </div>

            <div>
              <p className="label-caps">
                Inconclusive
              </p>

              <p className="mt-1 text-lg font-semibold">
                {inconclusiveCount}
              </p>

              <p className="text-xs text-muted-foreground">
                Requires laboratory
                confirmation
              </p>
            </div>

            <div>
              <p className="label-caps">
                CSV reports
              </p>

              <p className="mt-1 text-lg font-semibold">
                {csvTests.length}
              </p>

              <p className="text-xs text-muted-foreground">
                Reference dataset
                records
              </p>
            </div>
          </div>
        </Panel>

        {/* ---------------------------------------------------
            FILTERS
        --------------------------------------------------- */}
        <Panel>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="label-caps">
                Screening register
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                {filteredTests.length}{" "}
                records
              </p>
            </div>

            <input
              value={query}
              onChange={(event) =>
                setQuery(
                  event.target.value,
                )
              }
              placeholder="Search tests..."
              className="h-10 rounded-md border bg-background px-3 text-sm outline-none"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {(
              [
                "all",
                "positive",
                "inconclusive",
                "negative",
              ] as const
            ).map((item) => (
              <button
                key={item}
                onClick={() =>
                  setStatus(
                    item,
                  )
                }
                className={`rounded-md border px-3 py-1.5 text-xs font-medium ${
                  status === item
                    ? "bg-primary text-primary-foreground"
                    : "bg-background"
                }`}
              >
                {item ===
                "all"
                  ? "All"
                  : item
                      .charAt(
                        0,
                      )
                      .toUpperCase() +
                    item.slice(
                      1,
                    )}
              </button>
            ))}
          </div>
        </Panel>

        {/* ---------------------------------------------------
            TEST TABLE
        --------------------------------------------------- */}
        <Panel>
          <div className="mb-4">
            <p className="label-caps">
              Tests & Evidence
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Live detector scans
              and CSV reference
              reports
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 py-3">
                    Test ID
                  </th>

                  <th className="px-3 py-3">
                    Classification
                  </th>

                  <th className="px-3 py-3">
                    Category
                  </th>

                  <th className="px-3 py-3">
                    Device
                  </th>

                  <th className="px-3 py-3">
                    Confidence
                  </th>

                  <th className="px-3 py-3">
                    Status
                  </th>

                  <th className="px-3 py-3">
                    Risk
                  </th>

                  <th className="px-3 py-3">
                    Time
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredTests.map(
                  (test: any) => {
                    const testId =
                      test.test_id ??
                      test.id;

                    return (
                      <tr
                        key={`${test.source ?? "base"}-${testId}`}
                        className="border-b last:border-0"
                      >
                        <td className="px-3 py-3">
                          <Link
                            to="/tests/$testId"
                            params={{
                              testId:
                                String(
                                  testId,
                                ),
                            }}
                            className="font-mono text-xs font-semibold hover:underline"
                          >
                            {test.source ===
                            "CSV"
                              ? testId
                              : `SCAN-${String(
                                  testId,
                                )
                                  .slice(
                                    0,
                                    8,
                                  )
                                  .toUpperCase()}`}
                          </Link>
                        </td>

                        <td className="px-3 py-3 font-medium">
                          {test.substance_label ??
                            "Reference Record"}
                        </td>

                        <td className="px-3 py-3">
                          {CATEGORY_LABEL[
                            test.category as keyof typeof CATEGORY_LABEL
                          ] ??
                            test.category ??
                            "Unclassified"}
                        </td>

                        <td className="px-3 py-3 font-mono text-xs">
                          {test.device_id ??
                            "—"}
                        </td>

                        <td className="px-3 py-3 min-w-[120px]">
                          <ConfidenceBar
                            value={
                              Number(
                                test.confidence,
                              ) || 0
                            }
                          />
                        </td>

                        <td className="px-3 py-3">
                          <StatusBadge
                            status={
                              test.status
                            }
                          />
                        </td>

                        <td className="px-3 py-3">
                          <RiskBadge
                            level={
                              test.risk_level ??
                              "low"
                            }
                          />
                        </td>

                        <td className="px-3 py-3 whitespace-nowrap text-xs text-muted-foreground">
                          {test.created_at
                            ? formatDateTime(
                                test.created_at,
                              )
                            : "—"}
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* ---------------------------------------------------
            NOTICE
        --------------------------------------------------- */}
        <Panel>
          <p className="text-xs leading-5 text-muted-foreground">
            <strong className="text-foreground">
              Prototype screening
              notice:
            </strong>{" "}
            CSV records are used as
            reference/demo data for
            the SentinelGrid pipeline.
            Detector values and
            classification logic are
            for demonstration.
            Any real-world
            identification requires
            validated instrumentation
            and laboratory
            confirmation.
          </p>
        </Panel>
      </div>
    </AppShell>
  );
}