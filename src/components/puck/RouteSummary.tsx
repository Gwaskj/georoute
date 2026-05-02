"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type RouteSummary = {
  total_jobs: number;
  total_distance: number;
  vehicles: number;
};

export default function RouteSummary() {
  const [summary, setSummary] = useState<RouteSummary | null>(null);

  useEffect(() => {
    supabase
      .from("route_summary") // ✅ FIXED: remove generics
      .select("*")
      .single()
      .then(({ data }) => {
        setSummary(data as RouteSummary ?? null);
      });
  }, []);

  return (
    <div className="w-full rounded border bg-white p-4">
      <h2 className="text-lg font-semibold mb-3">Route Summary</h2>

      {!summary && (
        <p className="text-sm text-gray-500">No summary available.</p>
      )}

      {summary && (
        <ul className="text-sm space-y-1">
          <li>Total Jobs: {summary.total_jobs}</li>
          <li>Total Distance: {summary.total_distance} km</li>
          <li>Vehicles Used: {summary.vehicles}</li>
        </ul>
      )}
    </div>
  );
}
