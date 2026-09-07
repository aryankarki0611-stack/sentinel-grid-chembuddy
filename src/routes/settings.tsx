import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/sentinel/AppShell";
import { Panel } from "@/components/sentinel/primitives";
import { getUser } from "@/lib/sentinel/service";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — SentinelGrid" },
      {
        name: "description",
        content:
          "Operator profile, role-based access, data-protection posture and hardware integration endpoints for the SentinelGrid deployment.",
      },
      { property: "og:title", content: "Settings — SentinelGrid" },
      { property: "og:description", content: "Access control, privacy posture and device integration." },
    ],
  }),
  component: SettingsPage,
});

const ROLES = [
  { role: "officer", access: "Run screenings, view own tests" },
  { role: "analyst", access: "All tests, map, analytics" },
  { role: "supervisor", access: "Analyst access + alert triage + report sign-off" },
  { role: "admin", access: "Full access, device and user management" },
];

function SettingsPage() {
  const user = getUser();

  return (
    <AppShell title="Settings" subtitle="Deployment configuration · access control · integration">
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Operator profile">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            {[
              ["Display name", user.display_name],
              ["Badge ID", user.badge_id],
              ["Role", user.role],
              ["Unit", user.unit],
            ].map(([k, v]) => (
              <div key={k} className="rounded-md border border-border bg-background/50 p-3">
                <dt className="label-caps">{k}</dt>
                <dd className="mt-1 text-sm capitalize">{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>

        <Panel title="Role-based access" hint="Enforced server-side once connected to a database">
          <ul className="divide-y divide-border">
            {ROLES.map((r) => (
              <li key={r.role} className="flex items-center justify-between gap-4 py-2.5">
                <span className="font-mono text-xs uppercase text-primary">{r.role}</span>
                <span className="text-right text-xs text-muted-foreground">{r.access}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Data protection">
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>· Coordinates are coarsened to roughly 250 m before any event is published.</li>
            <li>· No suspect names, identifiers or biometric data are recorded anywhere.</li>
            <li>· Map events carry no operator identity.</li>
            <li>· Every record keeps an audit-friendly chain-of-custody trail.</li>
            <li>· Analytical results are presumptive and never a legal determination.</li>
          </ul>
        </Panel>

        <Panel title="Hardware integration" hint="Device firmware posts captures here">
          <pre className="overflow-x-auto rounded-md border border-border bg-background/60 p-3 font-mono text-[11px] leading-relaxed">
{`POST /api/device/readings
x-device-key: <DEVICE_API_KEY>

{
  "device_id": "SG-D01",
  "timestamp": "2026-09-02T09:00:00.000Z",
  "spectral_readings": [{ "channel": "F5", "nm": 555, "value": 0.82 }],
  "gas_sensor_reading": 182,
  "battery": 87,
  "location": { "lat": 30.7418, "lng": 76.7827 }
}`}
          </pre>
          <p className="mt-3 text-xs text-muted-foreground">
            Aggregate read-only intelligence is exposed at <span className="font-mono">GET /api/intel/summary</span>.
          </p>
        </Panel>
      </div>
    </AppShell>
  );
}
