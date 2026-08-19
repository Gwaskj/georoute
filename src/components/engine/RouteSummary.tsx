"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { loadFreeSchedulerData } from "@/lib/freeSession";
import { useUserTier } from "@/lib/hooks/useUserTier";

type RouteSummaryData = {
  total_jobs: number;
  total_distance: number;
  vehicles: number;
};

/**
 * The two fields this summary reads off a stored route.
 *
 * Narrow on purpose. Routes come from two sources with different shapes, and
 * declaring the whole of either here would tie this component to storage
 * details it does not use.
 */
type SummaryRoute = {
  staff_id?: string | null;
  distance?: number | null;
};

export default function RouteSummary() {
  const [summary, setSummary] = useState<RouteSummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    /**
     * Pro used to read this from the appointments and routes tables, kept live
     * by a realtime subscription. Both are gone; the summary comes from the
     * same local record everything else reads.
     */
    async function load() {
      setLoading(true);

      const data = await loadFreeSchedulerData();
      if (!data) {
        setSummary(null);
        setLoading(false);
        return;
      }

      const routes = (data.routes ?? []) as SummaryRoute[];

      setSummary({
        total_jobs: (data.appointments ?? []).length,
        total_distance: routes.reduce((sum, r) => sum + (r.distance ?? 0), 0),
        vehicles: new Set(routes.map((r) => r.staff_id)).size,
      });
      setLoading(false);
    }

    load();
  }, []);

  return (
    <div className="w-full rounded border border-slate-800 bg-slate-950 p-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-100">
        Route Summary
      </h2>

      {loading && (
        <p className="text-xs text-slate-400">Loading summary…</p>
      )}

      {!loading && !summary && (
        <p className="text-xs text-slate-400">No summary available.</p>
      )}

      {!loading && summary && (
        <ul className="space-y-1 text-xs text-slate-200">
          <li>Total Jobs: {summary.total_jobs}</li>
          <li>Total Distance: {summary.total_distance} km</li>
          <li>Vehicles Used: {summary.vehicles}</li>
        </ul>
      )}
    </div>
  );
}
