import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Brain,
  Cpu,
  FileText,
  LayoutDashboard,
  LogOut,
  Map as MapIcon,
  Settings as SettingsIcon,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { readSession, signOut } from "@/lib/sentinel/auth";
import { getAlerts, getCommandMetrics, getUser } from "@/lib/sentinel/service";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/map", label: "Live Map", icon: MapIcon },
  { to: "/devices", label: "Devices", icon: Cpu },
  { to: "/chembuddy", label: "ChemBuddy", icon: Brain },
  { to: "/tests", label: "Tests & Evidence", icon: FileText },
  { to: "/alerts", label: "Alerts", icon: AlertTriangle },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

export function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [authorized, setAuthorized] = useState(false);
  const [clock, setClock] = useState<string>("");

  useEffect(() => {
    if (!readSession()) {
      navigate({ to: "/" });
      return;
    }
    setAuthorized(true);
  }, [navigate]);

  useEffect(() => {
    const tick = () =>
      setClock(
        new Date().toLocaleString("en-GB", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const user = getUser();
  const metrics = getCommandMetrics();
  const openAlerts = getAlerts().filter((a) => a.status === "open").length;

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="label-caps animate-pulse">Verifying credentials…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-surface lg:flex">
        <div className="flex items-center gap-2.5 border-b border-border px-5 py-4">
          <div className="grid size-9 place-items-center rounded-md border border-primary/40 bg-primary/10">
            <ShieldCheck className="size-5 text-primary" />
          </div>
          <div className="leading-tight">
            <p className="font-mono text-sm font-semibold tracking-wide">SENTINELGRID</p>
            <p className="label-caps">City Intelligence</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((item) => {
            const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-primary/12 text-primary shadow-[inset_2px_0_0_0_var(--primary)]"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                )}
              >
                <item.icon className="size-4" />
                <span className="flex-1">{item.label}</span>
                {item.to === "/alerts" && openAlerts > 0 && (
                  <span className="rounded-full bg-destructive/20 px-1.5 font-mono text-[10px] text-destructive">
                    {openAlerts}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-3">
          <div className="rounded-md border border-border bg-background/60 p-3">
            <p className="label-caps">Grid Load</p>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-mono text-xl">{metrics.last24h}</span>
              <span className="text-xs text-muted-foreground">tests / 24h</span>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.min(100, metrics.last24h * 12)}%` }}
              />
            </div>
          </div>
          <button
            onClick={() => {
              signOut();
              navigate({ to: "/" });
            }}
            className="mt-3 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
          >
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 glass">
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 lg:px-6">
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-semibold tracking-tight">{title}</h1>
              {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden items-center gap-1.5 rounded-md border border-success/40 bg-success/10 px-2 py-1 font-mono text-[11px] text-success sm:inline-flex">
                <Activity className="size-3" /> SYSTEM NOMINAL
              </span>
              <span className="hidden font-mono text-xs text-muted-foreground md:inline">{clock}</span>
              <Link
                to="/alerts"
                className="relative grid size-9 place-items-center rounded-md border border-border bg-surface text-muted-foreground transition-colors hover:text-foreground"
              >
                <Bell className="size-4" />
                {openAlerts > 0 && (
                  <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-destructive font-mono text-[10px] text-destructive-foreground">
                    {openAlerts}
                  </span>
                )}
              </Link>
              <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-1.5">
                <div className="grid size-7 place-items-center rounded bg-primary/15 font-mono text-[11px] text-primary">
                  {user.display_name.slice(-2).toUpperCase()}
                </div>
                <div className="hidden leading-tight sm:block">
                  <p className="text-xs font-medium">{user.display_name}</p>
                  <p className="label-caps">
                    {user.role} · {user.badge_id}
                  </p>
                </div>
              </div>
            </div>
          </div>
          {actions && <div className="border-t border-border px-4 py-2 lg:px-6">{actions}</div>}
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b border-border bg-surface px-3 py-2 lg:hidden">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="whitespace-nowrap rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
              activeProps={{ className: "bg-primary/12 text-primary" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
