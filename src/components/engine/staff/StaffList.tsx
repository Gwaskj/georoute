"use client";

import { useStaffStore } from "@/store/staffStore";

interface StaffListProps {
  visibleIds: string[];
  onEdit: (id: string) => void;
}

export default function StaffList({ visibleIds, onEdit }: StaffListProps) {
  const {
    staff,
    selectedStaffIds,
    setSelectedStaffIds,
    deleteStaff,
  } = useStaffStore();

  // No archived filtering anymore
  const visibleStaff = staff.filter((s) => visibleIds.includes(s.id));

  const toggleSelected = (id: string) => {
    setSelectedStaffIds(
      selectedStaffIds.includes(id)
        ? selectedStaffIds.filter((x) => x !== id)
        : [...selectedStaffIds, id]
    );
  };

  if (visibleStaff.length === 0) {
    return <p className="text-sm text-slate-500 py-2">No staff added yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
            <th className="pb-2 pr-4 w-8"></th>
            <th className="pb-2 pr-4">Name</th>
            <th className="pb-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {visibleStaff.map((s) => (
            <tr key={s.id} className="border-b border-slate-800/50 hover:bg-slate-800/20">
              <td className="py-2 pr-4">
                <input
                  type="checkbox"
                  checked={selectedStaffIds.includes(s.id)}
                  onChange={() => toggleSelected(s.id)}
                  className="accent-teal-500"
                />
              </td>
              <td className="py-2 pr-4 font-medium text-slate-100">{s.name}</td>
              <td className="py-2 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(s.id)}
                    className="rounded border border-slate-500 px-2 py-0.5 text-xs text-slate-200 hover:bg-slate-700"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteStaff(s.id)}
                    className="rounded border border-red-500 px-2 py-0.5 text-xs text-red-300 hover:bg-red-950"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
