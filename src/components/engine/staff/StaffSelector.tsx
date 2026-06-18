"use client";

import { useStaffStore } from "@/store/staffStore";
import { useScheduleResultStore } from "@/store/scheduleResultStore";
import { clearSchedulerResult } from "@/lib/scheduler/persist";
import AddStaff from "./AddStaff";
import StaffList from "./StaffList";

interface StaffSelectorProps {
  isFree: boolean;
}

export default function StaffSelector({ isFree }: StaffSelectorProps) {
  const { staff, selectedStaffIds, clearAllStaff } = useStaffStore();
  const clearScheduleResult = useScheduleResultStore((s) => s.clearResult);

  const visibleIds = staff.map((s) => s.id);

  const handleEdit = (id: string) => {
    document.dispatchEvent(
      new CustomEvent("georoute-edit-staff", { detail: { id } })
    );
  };

  const handleClearAll = () => {
    if (staff.length === 0) return;
    if (window.confirm(`Remove all ${staff.length} staff member${staff.length !== 1 ? "s" : ""}?`)) {
      clearAllStaff();
      clearScheduleResult();
      clearSchedulerResult(isFree);
    }
  };

  return (
    <div className="space-y-4 rounded border border-slate-700 bg-slate-900 p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-slate-200">
          Staff{" "}
          <span className="text-slate-500">
            (Selected: {selectedStaffIds.length})
          </span>
        </h2>

        <div className="flex items-center gap-2">
          {staff.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="rounded border border-red-600 px-3 py-1.5 text-xs text-red-400 hover:bg-red-950"
            >
              Clear all
            </button>
          )}
          <AddStaff isFree={isFree} triggerOnly />
        </div>
      </div>

      {/* Staff list now receives onEdit */}
      <StaffList visibleIds={visibleIds} onEdit={handleEdit} />
    </div>
  );
}
