"use client";

import { useStaffStore } from "@/store/staffStore";

interface StaffListProps {
  visibleIds: string[];
  onEdit: (id: string) => void;   // ⭐ NEW
}

export default function StaffList({ visibleIds, onEdit }: StaffListProps) {
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
    <div className="space-y-3">
      {visibleStaff.length === 0 && (
        <p className="text-sm text-slate-500">
          No staff match the current filters.
        </p>
      )}

      <ul className="space-y-1 text-sm">
        {visibleStaff.map((s) => (
          <li
            key={s.id}
            className="flex items-center justify-between rounded border border-slate-700 bg-slate-900 px-3 py-1.5"
          >
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedStaffIds.includes(s.id)}
                onChange={() => toggleSelected(s.id)}
              />
              <span className="font-medium text-slate-100">{s.name}</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <button
                type="button"
                onClick={() => onEdit(s.id)}   // ⭐ FIXED
                className="rounded border border-blue-600 px-2 py-0.5 text-blue-400 hover:bg-blue-950"
              >
                Edit
              </button>

              <button
                type="button"
                onClick={() => duplicateStaff(s.id)}
                className="rounded border border-slate-600 px-2 py-0.5 hover:bg-slate-800"
              >
                Duplicate
              </button>

              <button
                type="button"
                onClick={() => deleteStaff(s.id)}
                className="rounded border border-red-600 px-2 py-0.5 text-red-400 hover:bg-red-950"
              >
                Delete
              </button>

              <button
                type="button"
                onClick={() => archiveStaff(s.id)}
                className="rounded border border-yellow-600 px-2 py-0.5 text-yellow-400 hover:bg-yellow-950"
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
