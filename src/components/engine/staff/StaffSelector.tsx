"use client";

import { useCallback, useState } from "react";
import StaffFilter from "./StaffFilter";
import StaffList from "./StaffList";
import AddStaff from "./AddStaff";
import { useStaffStore } from "@/store/staffStore";

interface StaffSelectorProps {
  isFree: boolean;
}

export default function StaffSelector({ isFree }: StaffSelectorProps) {
  const [filteredIds, setFilteredIds] = useState<string[]>([]);
  const { staff, selectedStaffIds } = useStaffStore();

  const handleFilteredIdsChange = useCallback((ids: string[]) => {
    setFilteredIds(ids);
  }, []);

  const effectiveIds =
    filteredIds.length > 0
      ? filteredIds
      : staff.filter((s) => !s.archived).map((s) => s.id);

  return (
    <div className="space-y-4 rounded border border-gray-200 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-base font-semibold">Staff selection</h2>
        <span className="text-xs text-gray-500">
          Selected: {selectedStaffIds.length}
        </span>
      </div>

      <AddStaff isFree={isFree} />

      <StaffFilter onFilteredIdsChange={handleFilteredIdsChange} />

      <StaffList visibleIds={effectiveIds} />
    </div>
  );
}
