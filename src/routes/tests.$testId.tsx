import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, FileDown, ShieldQuestion } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "../lib/supabaseClient";

import { AppShell } from "@/components/sentinel/AppShell";
import { ChemBuddyDetail } from "@/components/sentinel/ChemBuddyReport";

import {
  EmptyState,
  Panel,
  RiskBadge,
  StatusBadge,
} from "@/components/sentinel/primitives";

import { CATEGORY_LABEL, formatDateTime } from "@/lib/sentinel/format";

import {
  getAnalysisForTest,
  getLocation,
  getReportForTest,
  getTest,
  getTests,
} from "@/lib/sentinel/service";

export const Route = createFileRoute("/tests/$testId")({
  component: TestDetailPage,
});

function TestDetailPage() {
  const { testId } = useParams({
    from: "/tests/$testId",
  });

  const [test, setTest] = useState<any>(null);
  const [activeScan, setActiveScan] = useState<any>(null);

  useEffect(() => {
    const loadScan = async () => {
      const { data, error } = await supabase
        .from("scans")
        .select("*")
        .eq("id", testId)
        .maybeSingle();

      if (error) {
        console.error("Error loading scan:", error);
      }

      const scan: any = data;

      if (scan) {
        setActiveScan(scan);

        const template = getTests()[0];

        const spectral = Number(
          scan["spectral_reading"] ?? 0
        );

        const gas = Number(
          scan["gas_reading"] ?? 0
        );

        const confidence = Math.max(
          0,
          Math.min(
            100,
            100 - Math.abs(spectral - 2500) / 50
          )
        );

        const isMatch =
          confidence > 85 && gas > 1000;

        setTest({
          ...(template ?? {}),

          id: scan["id"],
          test_id: scan["id"],

          spectral_reading: spectral,
          gas_reading: gas,

          confidence: confidence / 100,

          substance_label: isMatch
            ? "Prototype Target Signature"
            : "Unclassified Sample",

          category: "unknown",

          device_id:
            template?.device_id ??
            "FIELD-DETECTOR-01",

          risk_level: isMatch
            ? "high"
            : confidence > 50
              ? "medium"
              : "low",

          status: isMatch
            ? "completed"
            : "review",

          created_at:
            scan["created_at"] ??
            scan["timestamp"] ??
            new Date().toISOString(),
        });

        return;
      }

      /*
       * Fallback for existing demo records.
       */
      const demoTest = getTest(testId);

      if (demoTest) {
        setTest(demoTest);
      }
    };

    loadScan();

    /*
     * Realtime Supabase updates.
     */
    const channel = supabase
      .channel(`test-detail-${testId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "scans",
        },
        (payload) => {
          const scan: any = payload.new;

          if (scan["id"] !== testId) {
            return;
          }

          setActiveScan(scan);

          const template = getTests()[0];

          const spectral = Number(
            scan["spectral_reading"] ?? 0
          );

          const gas = Number(
            scan["gas_reading"] ?? 0
          );

          const confidence = Math.max(
            0,
            Math.min(
              100,
              100 - Math.abs(spectral - 2500) / 50
            )
          );

          const isMatch =
            confidence > 85 && gas > 1000;

          setTest({
            ...(template ?? {}),

            id: scan["id"],
            test_id: scan["id"],

            spectral_reading: spectral,
            gas_reading: gas,

            confidence: confidence / 100,

            substance_label: isMatch
              ? "Prototype Target Signature"
              : "Unclassified Sample",

            category: "unknown",

            device_id:
              template?.device_id ??
              "FIELD-DETECTOR-01",

            risk_level: isMatch
              ? "high"
              : confidence > 50
                ? "medium"
                : "low",

            status: isMatch
              ? "completed"
              : "review",

            created_at:
              scan["created_at"] ??
              scan["timestamp"] ??
              new Date().toISOString(),
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [testId]);

  /*
   * Live reading comes directly from the
   * exact Supabase scan.
   */
  const liveReading = activeScan
    ? {
        spectral_reading: Number(
          activeScan["spectral_reading"] ?? 0
        ),

        gas_reading: Number(
          activeScan["gas_reading"] ?? 0
        ),

        gas_ppm: Number(
          activeScan["gas_reading"] ?? 0
        ),

        spectral: [],
        gas: [],
      }
    : undefined;

  /*
   * ChemBuddy uses the existing analysis template
   * while the sensor values above remain live.
   */
  const templateId = getTests()[0]?.id;

  const analysis = templateId
    ? getAnalysisForTest(templateId)
    : undefined;

  const report = templateId
    ? getReportForTest(templateId)
    : undefined;

  const location =
    test?.location_id &&
    test.location_id !== "live"
      ? getLocation(test.location_id)
      : undefined;

  /*
   * Live confidence.
   */
  const spectralValue = activeScan
    ? Number(
        activeScan["spectral_reading"] ?? 0
      )
    : 0;

  const gasValue = activeScan
    ? Number(
        activeScan["gas_reading"] ?? 0
      )
    : 0;

  const liveConfidence = activeScan
    ? Math.max(
        0,
        Math.min(
          100,
          100 -
            Math.abs(
              spectralValue - 2500
            ) /
              50
        )
      )
    : Number(test?.confidence ?? 0) * 100;

  /*
   * Loading / not found state.
   */
  if (!test) {
    return (
      <AppShell title="Tests & Evidence">
        <div className="p-6">
          <EmptyState
            message={`No record found for ${testId}`}
          />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Tests & Evidence">
      <div className="space-y-6 p-6">

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <Link
              to="/tests"
              className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Tests & Evidence
            </Link>

            <div className="flex items-center gap-3">
              <div>
                <p className="label-caps">
                  EVIDENCE RECORD
                </p>

                <h1 className="text-2xl font-semibold tracking-tight">
                  {activeScan?.["id"] ??
                    test.test_id ??
                    test.id}
                </h1>
              </div>

              <StatusBadge
                status={test.status as any}
              />

              <RiskBadge
                level={test.risk_level as any}
              />
            </div>
          </div>

          <button
            className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted"
            onClick={() =>
              toast.info(
                "Evidence export is available in the prototype."
              )
            }
          >
            <FileDown className="h-4 w-4" />
            Export Evidence
          </button>
        </div>

        {/* TEST SUMMARY */}
        <Panel
          title="Test Summary"
          hint="Evidence-linked screening record"
          bodyClassName="p-4"
        >
          <div className="grid gap-4 md:grid-cols-4">

            <div>
              <p className="label-caps">
                CLASSIFICATION
              </p>

              <p className="mt-1 text-lg font-semibold">
                {test.substance_label ??
                  CATEGORY_LABEL[
                    test.category as keyof typeof CATEGORY_LABEL
                  ] ??
                  "Unclassified"}
              </p>
            </div>

            <div>
              <p className="label-caps">
                CONFIDENCE
              </p>

              <p className="mt-1 text-lg font-semibold">
                {Math.round(liveConfidence)}%
              </p>
            </div>

            <div>
              <p className="label-caps">
                DEVICE
              </p>

              <p className="mt-1 font-mono text-sm">
                {test.device_id ??
                  "FIELD-DETECTOR-01"}
              </p>
            </div>

            <div>
              <p className="label-caps">
                TIMESTAMP
              </p>

              <p className="mt-1 text-sm">
                {formatDateTime(
                  test.created_at
                )}
              </p>
            </div>

          </div>
        </Panel>

        {/* LIVE DETECTOR READING */}
        {activeScan && (
          <Panel
            title="Live Detector Reading"
            hint="Values received directly from Supabase"
            bodyClassName="p-4"
          >
            <div className="grid gap-4 md:grid-cols-3">

              <div className="rounded-md border p-4">
                <p className="label-caps">
                  SPECTRAL READING
                </p>

                <p className="mt-2 font-mono text-2xl font-bold">
                  {activeScan["spectral_reading"]}
                </p>
              </div>

              <div className="rounded-md border p-4">
                <p className="label-caps">
                  GAS READING
                </p>

                <p className="mt-2 font-mono text-2xl font-bold">
                  {activeScan["gas_reading"]}
                </p>
              </div>

              <div className="rounded-md border p-4">
                <p className="label-caps">
                  SCAN ID
                </p>

                <p className="mt-2 break-all font-mono text-xs">
                  {activeScan["id"]}
                </p>
              </div>

            </div>
          </Panel>
        )}

        {/* CHEMBUDDY */}
        {liveReading && (
          <Panel
            title="ChemBuddy Explainable Analysis"
            hint="Prototype screening interpretation"
            bodyClassName="p-4"
          >
            <ChemBuddyDetail
              analysis={analysis as any}
             reading={liveReading as any}
              test={test as any}
            />
          </Panel>
        )}

        {/* LOCATION & DEVICE */}
        <Panel
          title="Location & Device"
          hint="Context associated with the evidence record"
          bodyClassName="p-4"
        >
          <div className="grid gap-4 md:grid-cols-3">

            <div>
              <p className="label-caps">
                DEVICE ID
              </p>

              <p className="mt-1 font-mono text-sm">
                {test.device_id ??
                  "FIELD-DETECTOR-01"}
              </p>
            </div>

            <div>
              <p className="label-caps">
                LOCATION
              </p>

              <p className="mt-1 text-sm">
  Live field location
</p>
            </div>

            <div>
              <p className="label-caps">
                EVIDENCE ID
              </p>

              <p className="mt-1 break-all font-mono text-xs">
                {activeScan?.["id"] ??
                  test.test_id ??
                  test.id}
              </p>
            </div>

          </div>
        </Panel>

        {/* CHAIN OF CUSTODY */}
        <Panel
          title="Chain of Custody"
          hint="Prototype evidence integrity trail"
          bodyClassName="p-4"
        >
          <div className="space-y-3">

            <div className="flex items-center gap-3">
              <ShieldQuestion className="h-5 w-5 text-primary" />

              <div>
                <p className="font-medium">
                  Evidence record created
                </p>

                <p className="text-sm text-muted-foreground">
                  Sensor readings stored in Supabase
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ShieldQuestion className="h-5 w-5 text-primary" />

              <div>
                <p className="font-medium">
                  ChemBuddy analysis generated
                </p>

                <p className="text-sm text-muted-foreground">
                  Explainable prototype classification
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ShieldQuestion className="h-5 w-5 text-primary" />

              <div>
                <p className="font-medium">
                  Record available to command dashboard
                </p>

                <p className="text-sm text-muted-foreground">
                  Evidence can be reviewed through SentinelGrid
                </p>
              </div>
            </div>

          </div>
        </Panel>

        {/* PROTOTYPE NOTICE */}
        <div className="rounded-md border border-yellow-500/30 bg-yellow-500/5 p-4">
          <p className="text-sm font-semibold">
            Prototype Notice
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            SentinelGrid and ChemBuddy are demonstrated
            as a hackathon prototype. Sensor values and
            classifications are screening signals only.
            Laboratory confirmation is required before
            any operational or legal decision.
          </p>
        </div>

      </div>
    </AppShell>
  );
}
