// src/components/schedule/ScheduleSidebar.tsx
"use client";

import ScheduleTable from "@/components/engine/ScheduleTable";
import GenerateSchedulePro from "@/components/engine/GenerateSchedule";

import AddAppointment from "@/components/engine/appointments/AddAppointment";
import CustomWindowsManager from "@/components/engine/windows/CustomWindowsManager";

type ScheduleSidebarProps = {
  isFree: boolean;
};

export default function ScheduleSidebar({ isFree }: ScheduleSidebarProps) {
  return (
    <div className="flex h-full flex-col gap-4 rounded-lg border border-slate-800 bg-slate-900 p-4">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-100">Quick actions</h2>

        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
          {isFree ? "Free mode" : "Pro mode"}
        </span>
      </div>

      {/* GENERATOR (Pro only) */}
      {!isFree && (
        <div className="rounded-md border border-slate-800 bg-slate-950 p-3">
          <p className="mb-2 text-xs text-slate-300">
            Generate optimised routes using your saved staff, clients, and cached data.
          </p>

          <GenerateSchedulePro algorithm="default" isFree={isFree} />
        </div>
      )}

      {/* FREE MODE MESSAGE */}
      {isFree && (
        <div className="rounded-md border border-slate-800 bg-slate-950 p-3">
          <p className="text-xs text-slate-300">
            You can generate routes, but your staff, clients, and appointments
            are not saved. Upgrade to Pro to unlock persistence and cached routes.
          </p>
        </div>
      )}

      {/* CALL PURPOSES */}
      <div className="rounded-md border border-slate-800 bg-slate-950 p-3">
      </div>

      {/* CUSTOM WINDOWS */}
      <div className="rounded-md border border-slate-800 bg-slate-950 p-3">
        <CustomWindowsManager isFree={isFree} />
      </div>

      {/* APPOINTMENTS */}
      <div className="rounded-md border border-slate-800 bg-slate-950 p-3">
        <AddAppointment isFree={isFree} />
      </div>

      {/* LIVE APPOINTMENTS */}
      <div className="flex-1 overflow-hidden rounded-md border border-slate-800 bg-slate-950">
        <div className="border-b border-slate-800 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Live appointments
        </div>

        <div className="h-full overflow-auto p-3">
          <ScheduleTable isFree={isFree} />
        </div>
      </div>
    </div>
  );
}
