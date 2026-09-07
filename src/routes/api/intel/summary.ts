import { createFileRoute } from "@tanstack/react-router";
import {
  getCategoryDistribution,
  getCommandMetrics,
  getEvents,
  getHotspots,
} from "@/lib/sentinel/service";

/**
 * GET /api/intel/summary
 *
 * Read-only, fully anonymized aggregate intelligence for external consumers
 * (situation boards, briefing screens). No operator identity, no exact
 * coordinates, no case data.
 */
export const Route = createFileRoute("/api/intel/summary")({
  server: {
    handlers: {
      GET: async () => {
        const metrics = getCommandMetrics();
        return Response.json(
          {
            generated_at: new Date().toISOString(),
            metrics,
            categories: getCategoryDistribution(),
            hotspots: getHotspots()
              .filter((h) => h.events > 0)
              .slice(0, 5)
              .map((h) => ({
                zone: h.location.zone,
                district: h.location.district,
                events: h.events,
                positives: h.positives,
              })),
            recent_events: getEvents()
              .slice(0, 10)
              .map((e) => ({
                id: e.id,
                occurred_at: e.occurred_at,
                category: e.category,
                risk_level: e.risk_level,
                status: e.status,
                confidence: e.confidence,
              })),
          },
          { headers: { "cache-control": "no-store" } },
        );
      },
    },
  },
});
