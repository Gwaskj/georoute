"use client";

import StaffSelector from "@/components/engine/StaffSelector";
import GenerateSchedule from "@/components/engine/GenerateSchedule";
import ScheduleTable from "@/components/engine/ScheduleTable";
import RouteSummary from "@/components/engine/RouteSummary";
import MapVisualizer from "@/components/engine/MapVisualizer.client";

export default function SchedulePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Schedule Generator</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-4">
          <StaffSelector />
          <GenerateSchedule algorithm="default" />   {/* FIXED */}
        </div>

        <div className="md:col-span-2 space-y-4">
          <ScheduleTable />
          <RouteSummary />
          <MapVisualizer />
        </div>
      </div>
    </div>
  );
}
