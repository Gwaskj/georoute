"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type RouteSummaryData = {
  total_jobs: number;
  total_distance: number;
  vehicles: number;
};

// ⭐ FIX: Create Supabase client ONCE at module level
const supabase = createSupabaseBrowserClient();

export default function RouteSummary({ isFree }: { isFree: boolean }) {
  const [summary, setSummary] = useState<RouteSummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);

      if (isFree) {
        setSummary(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("route_summary")
        .select("*")
        .single();

      if (error) {
        console.error("Error loading route summary:", error);
        setSummary(null);
      } else {
        setSummary(data as RouteSummaryData);
      }

      setLoading(false);
    }

    load();

    if (!isFree) {
      const channel = supabase
        .channel("route-summary-updates")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "route_summary" },
          () => load()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
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
