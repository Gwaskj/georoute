// C:\Users\matth\georoute\src\components\engine\GenerateSchedule.tsx
"use client";

import { useState } from "react";
import {
  loadFreeSchedulerData,
  saveFreeSchedulerData,
  FreeSchedulerData,
} from "@/lib/freeSession";

type FreeRoute = {
  id: string;
  staff_id: string | null;
  color: string;
  points: [number, number][];
};

export default function GenerateSchedule() {
  const [loading, setLoading] = useState(false);

  async function loadFreeAppointments() {
    const data = await loadFreeSchedulerData();
    return data?.appointments ?? [];
  }

  async function saveFreeRoutes(routes: FreeRoute[]) {
    const existing: FreeSchedulerData =
      (await loadFreeSchedulerData()) ?? {
        staff: [],
        appointments: [],
        routes: [],
        visits: [],
        officePostcode: null,
        selectedStaffIds: [],
      };

    await saveFreeSchedulerData({
      ...existing,
      routes,
    });
  }

  async function generate() {
    setLoading(true);

    const appointments = await loadFreeAppointments();
    if (!appointments || appointments.length === 0) {
      setLoading(false);
      return;
    }

    const staffRoutes: Record<
      string,
      { id: string; staff_id: string | null; color: string; points: [number, number][] }
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
    }

    const finalRoutes = Object.values(staffRoutes);
    await saveFreeRoutes(finalRoutes);

    setLoading(false);
  }

  return (
    <button
      onClick={generate}
      disabled={loading}
      className="rounded bg-sky-600 px-4 py-2 text-xs font-medium text-white hover:bg-sky-500 disabled:opacity-50"
    >
      {loading ? "Generating…" : "Generate Local Routes"}
    </button>
  );
}
