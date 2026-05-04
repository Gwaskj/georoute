"use client";

import ScheduleTable from "@/components/schedule/ScheduleTable";
import GenerateSchedule from "@/components/schedule/GenerateSchedule";

export default function ScheduleSidebar() {
  return (
    <div className="w-full h-full flex flex-col gap-4 p-4 border-r bg-white">
      <GenerateSchedule />
      <div className="flex-1 overflow-auto">
        <ScheduleTable />
      </div>
    </div>
  );
}
