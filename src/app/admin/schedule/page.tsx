"use client";

import { useUserTier } from "@/lib/hooks/useUserTier";
import { useIsAdmin } from "@/lib/hooks/useIsAdmin";

import StaffSelector from "@/components/engine/staff/StaffSelector";
import AddStaff from "@/components/engine/staff/AddStaff";
import AddAppointment from "@/components/engine/appointments/AddAppointment";
import CustomWindowsManager from "@/components/engine/windows/CustomWindowsManager";

import GenerateSchedule from "@/components/engine/GenerateSchedule";
import ScheduleTable from "@/components/engine/ScheduleTable";
import RouteSummary from "@/components/engine/RouteSummary";
import MapVisualizer from "@/components/engine/MapVisualizer.client";

export default function SchedulePage() {
  const isFree = useUserTier();
  const isAdmin = useIsAdmin();

  // Belt and braces. Middleware already refuses this route to non-admins
  // before it renders, so this only matters if that guard is ever loosened --
  // but this page had no check of its own at all, and served a working
  // scheduler to anyone who typed the URL.
  if (isAdmin === null) return null;
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center text-slate-400">
        You do not have permission to view this page.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 p-6">

      <AddStaff isFree={isFree} />

      <AddAppointment isFree={isFree} />

      <CustomWindowsManager isFree={isFree} />

      <StaffSelector isFree={isFree} />

      <GenerateSchedule algorithm="default" isFree={isFree} />

      <ScheduleTable isFree={isFree} />

      <RouteSummary/>

      {/* ❌ remove isFree — MapVisualizer does not accept it */}
      <MapVisualizer />
    </div>
  );
}
