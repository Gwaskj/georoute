"use client";

import MapVisualizerClient from "@/components/engine/MapVisualizer.client";
import ScheduleTable from "@/components/schedule/ScheduleTable";
import GenerateSchedule from "@/components/schedule/GenerateSchedule";

export default function SchedulePage() {
  return (
    <div className="w-full h-full grid grid-cols-2 gap-4 p-4">
      <div className="flex flex-col gap-4">
        <GenerateSchedule />
        <ScheduleTable />
      </div>

      <div className="w-full h-full">
        <MapVisualizerClient
          zoom={12}
          showRoutes={true}
          showAppointments={true}
          showStaffRoutes={true}
        />
      </div>
    </div>
  );
}
