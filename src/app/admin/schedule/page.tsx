"use client";

import { useUserTier } from "@/lib/hooks/useUserTier";

import StaffSelector from "@/components/engine/StaffSelector";
import AddStaff from "@/components/engine/staff/AddStaff";
import AddAppointment from "@/components/engine/appointments/AddAppointment";
import CustomWindowsManager from "@/components/engine/windows/CustomWindowsManager";

import GenerateSchedule from "@/components/engine/GenerateSchedule";
import ScheduleTable from "@/components/engine/ScheduleTable";
import RouteSummary from "@/components/engine/RouteSummary";
import MapVisualizer from "@/components/engine/MapVisualizer.client";

export default function SchedulePage() {
  const { isFree } = useUserTier();

  return (
    <div className="flex flex-col gap-8 p-6">

      <AddStaff isFree={isFree} />

      <AddAppointment isFree={isFree} />

     <CustomWindowsManager isFree={isFree} />

      <StaffSelector isFree={isFree} />

      <GenerateSchedule algorithm="default" isFree={isFree} />

      <ScheduleTable isFree={isFree} />

      <RouteSummary isFree={isFree} />

      <MapVisualizer isFree={isFree} />
    </div>
  );
}
