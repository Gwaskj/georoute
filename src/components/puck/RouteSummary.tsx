"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type RouteSummaryProps = {
  showDistance: boolean;
};

export default function RouteSummary({ showDistance }: RouteSummaryProps) {
<<<<<<< deepsource-autofix-de12d177
  const [summary, setSummary] = useState<{ total_jobs: number; total_distance: number; vehicles: number; } | null>(null);

  useEffect(() => {
    supabase
      .from<{ total_jobs: number; total_distance: number; vehicles: number; }>("route_summary")
=======
  const [summary, setSummary] = useState<{ total_jobs: number; total_distance: number; vehicles: number } | null>(null);

  useEffect(() => {
    supabase
      .from<{ total_jobs: number; total_distance: number; vehicles: number }>("route_summary")
>>>>>>> main
      .select("*")
      .single()
      .then(({ data }) => {
        setSummary(data ?? null);
      });
  }, []);

  if (!summary) {
    return (
      <div className="w-full rounded border bg-white p-4">
        <p className="text-sm text-gray-500">No summary available.</p>
      </div>
    );
  }

  return (
    <div className="w-full rounded border bg-white p-4">
      <h2 className="text-lg font-semibold mb-2">Route Summary</h2>

      <ul className="text-sm text-gray-600 space-y-1">
        <li>Total jobs: {summary.total_jobs}</li>
        {showDistance && (
          <li>Total distance: {summary.total_distance} km</li>
        )}
        <li>Vehicles: {summary.vehicles}</li>
      </ul>
    </div>
  );
}
