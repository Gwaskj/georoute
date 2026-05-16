"use client";

import { useStaffStore } from "@/store/staffStore";
import AddStaff from "./AddStaff";
import StaffList from "./StaffList";

interface StaffSelectorProps {
  isFree: boolean;
}

export default function StaffSelector({ isFree }: StaffSelectorProps) {
  const { staff, selectedStaffIds } = useStaffStore();

  // No archived filtering anymore
  const visibleIds = staff.map((s) => s.id);

  // Correct event name for AddStaff edit modal
  const handleEdit = (id: string) => {
    document.dispatchEvent(
      new CustomEvent("georoute-edit-staff", { detail: { id } })
    );
  };

  return (
    <div className="space-y-4 rounded border border-slate-700 bg-slate-900 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-200">
          Staff{" "}
          <span className="text-slate-500">
            (Selected: {selectedStaffIds.length})
          </span>
        </h2>

        {/* AddStaff button (triggerOnly mode) */}
        <AddStaff isFree={isFree} triggerOnly />
      </div>

      {/* Staff list now receives onEdit */}
      <StaffList visibleIds={visibleIds} onEdit={handleEdit} />
    </div>
  );
}
