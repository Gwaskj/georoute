"use client";

import { useStaffStore } from "@/store/staffStore";

interface StaffListProps {
  visibleIds: string[]; // from filter
}

export default function StaffList({ visibleIds }: StaffListProps) {
  const {
    staff,
    selectedStaffIds,
    setSelectedStaffIds,
    deleteStaff,
    duplicateStaff,
    archiveStaff,
  } = useStaffStore();

  const visibleStaff = staff.filter(
    (s) => !s.archived && visibleIds.includes(s.id)
  );

  const toggleSelected = (id: string) => {
    setSelectedStaffIds(
      selectedStaffIds.includes(id)
        ? selectedStaffIds.filter((x) => x !== id)
        : [...selectedStaffIds, id]
    );
  };

  return (
    <div className="space-y-2">
      {visibleStaff.length === 0 && (
        <p className="text-sm text-gray-500">No staff match the current filters.</p>
      )}

      <ul className="space-y-1 text-sm">
        {visibleStaff.map((s) => (
          <li
            key={s.id}
            className="flex items-center justify-between rounded border border-gray-200 px-3 py-1.5"
          >
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedStaffIds.includes(s.id)}
                onChange={() => toggleSelected(s.id)}
              />
              <span className="font-medium">{s.name}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <button
                type="button"
                onClick={() => duplicateStaff(s.id)}
                className="rounded border border-gray-300 px-2 py-0.5 hover:bg-gray-50"
              >
                Duplicate
              </button>
              <button
                type="button"
                onClick={() => deleteStaff(s.id)}
                className="rounded border border-red-300 px-2 py-0.5 text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => archiveStaff(s.id)}
                className="rounded border border-yellow-300 px-2 py-0.5 text-yellow-700 hover:bg-yellow-50"
              >
                Archive
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
