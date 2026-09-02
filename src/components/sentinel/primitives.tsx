import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { RISK_LABEL, riskClasses, STATUS_LABEL, statusClasses } from "@/lib/sentinel/format";
import type { RiskLevel, TestStatus } from "@/lib/sentinel/types";
import { cn } from "@/lib/utils";

export function Panel({
  title,
  hint,
  actions,
  className,
  bodyClassName,
  children,
}: {
  title?: string;
  hint?: string;
  actions?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("panel flex flex-col", className)}>
      {(title || actions) && (
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
          <div className="min-w-0">
            {title && <h2 className="label-caps text-foreground/90">{title}</h2>}
            {hint && <p className="mt-0.5 truncate text-xs text-muted-foreground">{hint}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className={cn("flex-1 p-4", bodyClassName)}>{children}</div>
    </section>
  );
}

export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  delta?: string;
  icon: LucideIcon;
  tone?: "default" | "danger" | "warning" | "success";
}) {
  const toneClass = {
    default: "text-primary border-primary/30 bg-primary/10",
    danger: "text-destructive border-destructive/30 bg-destructive/10",
    warning: "text-warning border-warning/30 bg-warning/10",
    success: "text-success border-success/30 bg-success/10",
  }[tone];

  return (
    <div className="panel relative overflow-hidden p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="label-caps">{label}</p>
          <p className="mt-2 font-mono text-3xl leading-none tracking-tight">{value}</p>
          {delta && <p className="mt-2 text-xs text-muted-foreground">{delta}</p>}
        </div>
        <div className={cn("grid size-9 place-items-center rounded-md border", toneClass)}>
          <Icon className="size-4" />
        </div>
      </div>
    </div>
  );
}

export function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider",
        riskClasses[level],
      )}
    >
      {RISK_LABEL[level]}
    </span>
  );
}

export function StatusBadge({ status }: { status: TestStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider",
        statusClasses[status],
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

export function ConfidenceBar({ value, className }: { value: number; className?: string }) {
  const tone =
    value >= 0.85 ? "bg-destructive" : value >= 0.7 ? "bg-warning" : "bg-muted-foreground";
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div className={cn("h-full rounded-full transition-all", tone)} style={{ width: `${value * 100}%` }} />
      </div>
      <span className="w-9 shrink-0 text-right font-mono text-xs">{Math.round(value * 100)}%</span>
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="grid place-items-center rounded-md border border-dashed border-border py-10 text-sm text-muted-foreground">
      {message}
    </div>
  );
}
