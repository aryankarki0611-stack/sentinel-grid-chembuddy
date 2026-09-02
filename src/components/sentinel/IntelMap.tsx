import { useMemo } from "react";
import { CATEGORY_LABEL, relativeTime } from "@/lib/sentinel/format";
import type { DetectionEvent, Location } from "@/lib/sentinel/types";
import { cn } from "@/lib/utils";

/** Chandigarh bounding box used to project anonymized zone coordinates. */
const BOUNDS = { minLat: 30.7, maxLat: 30.775, minLng: 76.73, maxLng: 76.85 };

export function projectPoint(lat: number, lng: number) {
  const x = ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * 100;
  const y = (1 - (lat - BOUNDS.minLat) / (BOUNDS.maxLat - BOUNDS.minLat)) * 100;
  return { x: Math.min(96, Math.max(4, x)), y: Math.min(94, Math.max(6, y)) };
}

const riskDot: Record<string, string> = {
  critical: "bg-destructive shadow-[0_0_12px_var(--destructive)]",
  high: "bg-warning shadow-[0_0_12px_var(--warning)]",
  moderate: "bg-info shadow-[0_0_10px_var(--info)]",
  low: "bg-success",
};

export function IntelMap({
  events,
  locations,
  selectedId,
  onSelect,
  className,
}: {
  events: DetectionEvent[];
  locations: Location[];
  selectedId?: string | null;
  onSelect?: (event: DetectionEvent) => void;
  className?: string;
}) {
  const locById = useMemo(() => new Map(locations.map((l) => [l.id, l])), [locations]);

  const hotspots = useMemo(() => {
    return locations
      .map((loc) => ({
        loc,
        count: events.filter((e) => e.location_id === loc.id && e.status === "positive").length,
      }))
      .filter((h) => h.count > 0);
  }, [locations, events]);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border border-border bg-background grid-backdrop",
        className,
      )}
    >
      {/* radial scan sweep */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="sweep absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-primary/8 to-transparent" />
      </div>

      {/* hotspot fields */}
      {hotspots.map(({ loc, count }) => {
        const { x, y } = projectPoint(loc.lat, loc.lng);
        const size = 90 + count * 26;
        return (
          <div
            key={`hs-${loc.id}`}
            className="pointer-events-none absolute rounded-full bg-destructive/12 blur-2xl"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              width: size,
              height: size,
              transform: "translate(-50%, -50%)",
            }}
          />
        );
      })}

      {/* zone labels */}
      {locations.map((loc) => {
        const { x, y } = projectPoint(loc.lat, loc.lng);
        return (
          <span
            key={`lbl-${loc.id}`}
            className="pointer-events-none absolute -translate-x-1/2 translate-y-3 whitespace-nowrap font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            {loc.zone}
          </span>
        );
      })}

      {/* events */}
      {events.map((event, i) => {
        const loc = locById.get(event.location_id);
        if (!loc) return null;
        const jitterX = ((i % 5) - 2) * 1.6;
        const jitterY = ((i % 3) - 1) * 1.8;
        const { x, y } = projectPoint(loc.lat, loc.lng);
        const selected = selectedId === event.id;
        return (
          <button
            key={event.id}
            onClick={() => onSelect?.(event)}
            title={`${CATEGORY_LABEL[event.category]} · ${relativeTime(event.occurred_at)}`}
            className="absolute -translate-x-1/2 -translate-y-1/2 outline-none"
            style={{ left: `${x + jitterX}%`, top: `${y + jitterY}%` }}
          >
            <span className="relative grid place-items-center">
              {(event.risk_level === "critical" || event.risk_level === "high") && (
                <span
                  className={cn("pulse-ring absolute size-3 rounded-full", riskDot[event.risk_level])}
                />
              )}
              <span
                className={cn(
                  "size-2.5 rounded-full transition-transform",
                  riskDot[event.risk_level],
                  selected && "scale-[1.8] ring-2 ring-primary ring-offset-2 ring-offset-background",
                )}
              />
            </span>
          </button>
        );
      })}

      <div className="pointer-events-none absolute bottom-3 left-3 rounded-md border border-border bg-surface/85 p-2.5 backdrop-blur">
        <p className="label-caps mb-1.5">Legend</p>
        <ul className="space-y-1">
          {(["critical", "high", "moderate", "low"] as const).map((r) => (
            <li key={r} className="flex items-center gap-2 text-[11px] capitalize text-muted-foreground">
              <span className={cn("size-2 rounded-full", riskDot[r])} /> {r} risk
            </li>
          ))}
        </ul>
      </div>

      <div className="pointer-events-none absolute right-3 top-3 rounded-md border border-border bg-surface/85 px-2.5 py-1.5 backdrop-blur">
        <p className="label-caps">Chandigarh · anonymized</p>
        <p className="font-mono text-[11px]">{events.length} events plotted</p>
      </div>
    </div>
  );
}
