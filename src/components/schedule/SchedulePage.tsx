// src/components/schedule/SchedulePage.tsx
"use client";

import { useState } from "react";
import StaffSelector from "@/components/engine/staff/StaffSelector";
import GenerateSchedulePro from "@/components/engine/GenerateSchedule";
import ScheduleTable from "@/components/engine/ScheduleTable";
import MapVisualizer from "@/components/engine/MapVisualizer.client";
import RouteSummary from "@/components/engine/RouteSummary";
import ScheduleSidebar from "@/components/schedule/ScheduleSidebar";

type SchedulePageProps = {
  isFree: boolean;
};

export default function SchedulePage({ isFree }: SchedulePageProps) {
  const [mapHeight, setMapHeight] = useState(420);

  return (
    <div className="flex w-full gap-4">
      {/* LEFT SIDEBAR */}
      <div className="w-72">
        <div className="sticky top-4 h-[calc(100vh-6rem)]">
          <ScheduleSidebar isFree={isFree} />
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex flex-1 flex-col gap-4">
        {/* MAP */}
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-100">Map</h2>

            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span>Height</span>
              <input
                type="range"
                min={320}
                max={720}
                value={mapHeight}
                onChange={(e) => setMapHeight(Number(e.target.value))}
                className="w-32"
              />
            </div>
          </div>

          <div
            className="overflow-hidden rounded-md border border-slate-800 bg-slate-950"
            style={{ height: mapHeight }}
          >
            <MapVisualizer isFree={isFree} />
          </div>
        </div>

        {/* STAFF + GENERATOR */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* STAFF SELECTOR */}
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
            <StaffSelector isFree={isFree} />
          </div>

          {/* GENERATOR */}
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
            {isFree ? (
              <p className="text-xs text-slate-300">
                Upgrade to Pro to unlock saved staff, saved clients, cached
                routes, and unlimited optimisations.
              </p>
            ) : (
              <GenerateSchedulePro algorithm="default" isFree={isFree} />
            )}
          </div>
        </div>

        {/* SCHEDULE TABLE */}
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <ScheduleTable isFree={isFree} showTimes />
        </div>

        {/* ROUTE SUMMARY */}
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <RouteSummary isFree={isFree} />
        </div>
      </div>
    </div>
  );
}


