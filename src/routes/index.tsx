import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Lock, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { readSession, signIn } from "@/lib/sentinel/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SentinelGrid — Secure Access" },
      {
        name: "description",
        content:
          "Authorized access to SentinelGrid, the chemical detection and city intelligence platform with the ChemBuddy explainable AI module.",
      },
      { property: "og:title", content: "SentinelGrid — Secure Access" },
      {
        property: "og:description",
        content: "Restricted sign-in for the SentinelGrid command centre.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [badge, setBadge] = useState("CHD-4471");
  const [passphrase, setPassphrase] = useState("demo-access");
  const [error, setError] = useState("");

  useEffect(() => {
    if (readSession()) navigate({ to: "/dashboard" });
  }, [navigate]);

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-background px-4 grid-backdrop">
      <div className="pointer-events-none absolute inset-0">
        <div className="sweep absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-primary/6 to-transparent" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-md border border-primary/40 bg-primary/10">
            <ShieldCheck className="size-6 text-primary" />
          </div>
          <div>
            <h1 className="font-mono text-lg font-semibold tracking-wide">SENTINELGRID</h1>
            <p className="label-caps">Chemical detection · city intelligence</p>
          </div>
        </div>

        <form
          className="panel space-y-4 p-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (!badge.trim() || !passphrase.trim()) {
              setError("Badge ID and passphrase are required.");
              return;
            }
            signIn(badge.trim());
            navigate({ to: "/dashboard" });
          }}
        >
          <div>
            <h2 className="text-base font-semibold">Authorized personnel only</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Access is logged. Unauthorized use is an offence.
            </p>
          </div>

          <label className="block">
            <span className="label-caps">Badge ID</span>
            <input
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring"
              autoComplete="username"
            />
          </label>

          <label className="block">
            <span className="label-caps">Passphrase</span>
            <input
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring"
              autoComplete="current-password"
            />
          </label>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Lock className="size-4" /> Enter command centre
          </button>

          <p className="text-center text-[11px] text-muted-foreground">
            Demo build — role-based access and SSO are wired behind a single auth module.
          </p>
        </form>
      </div>
    </div>
  );
}
