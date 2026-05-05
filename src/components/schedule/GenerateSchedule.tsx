"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function GenerateSchedule() {
  const supabase = createSupabaseBrowserClient();
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);

    await supabase.from("routes").delete().neq("id", "");

    const { data: appointments } = await supabase
      .from("appointments")
      .select("*")
      .order("start_time", { ascending: true });

    if (!appointments) {
      setLoading(false);
      return;
    }

    const staffRoutes: Record<
      string,
      { id: string; staff_id: string; color: string; points: [number, number][] }
    > = {};

    for (const a of appointments) {
      if (!a.staff_id || !a.lat || !a.lng) continue;

      if (!staffRoutes[a.staff_id]) {
        staffRoutes[a.staff_id] = {
          id: crypto.randomUUID(),
          staff_id: a.staff_id,
          color: "#0070f3",
          points: [],
        };
      }

      staffRoutes[a.staff_id].points.push([a.lat, a.lng]);

      await supabase.from("routes").upsert({
        id: staffRoutes[a.staff_id].id,
        staff_id: a.staff_id,
        color: staffRoutes[a.staff_id].color,
        points: staffRoutes[a.staff_id].points,
      });

      await new Promise((r) => setTimeout(r, 150));
    }

    setLoading(false);
  }

  return (
    <button
      onClick={generate}
      disabled={loading}
      className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
    >
      {loading ? "Generating…" : "Generate Schedule"}
    </button>
  );
}
