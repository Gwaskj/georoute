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
  const isFree = useUserTier();
  const [summary, setSummary] = useState<RouteSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  async function loadFreeSummary(): Promise<RouteSummaryData | null> {
    const data = await loadFreeSchedulerData();
    if (!data) return null;

    const appointments = data.appointments ?? [];
    const routes = data.routes ?? [];

    const total_jobs = appointments.length;
    const vehicles = new Set(routes.map((r: SummaryRoute) => r.staff_id)).size;

    return {
      total_jobs,
      total_distance: 0,
      vehicles,
    };
  }

  async function loadProSummary(): Promise<RouteSummaryData | null> {
    const { data: appointments } = await supabase
      .from("appointments")
      .select("id");

    const { data: routes } = await supabase
      .from("routes")
      .select("staff_id, distance");

    const total_jobs = appointments?.length ?? 0;
    const vehicles = new Set(routes?.map((r: SummaryRoute) => r.staff_id)).size;

    const total_distance = routes?.reduce(
      (sum: number, r: SummaryRoute) => sum + (r.distance ?? 0),
      0
    ) ?? 0;

    return {
      total_jobs,
      total_distance,
      vehicles,
    };
  }

  useEffect(() => {
    async function load() {
      setLoading(true);

      const result = isFree
        ? await loadFreeSummary()
        : await loadProSummary();

      setSummary(result);
      setLoading(false);
    }

    load();

    if (!isFree && !channelRef.current) {
      channelRef.current = supabase
        .channel("route-summary-updates")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "routes" },
          () => load()
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "appointments" },
          () => load()
        )
        .subscribe();
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [isFree]);

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
