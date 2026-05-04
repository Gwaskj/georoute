"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Staff = {
  id: string;
  name: string;
  postcode: string;
  availableStart: string;
  availableEnd: string;
  gender?: string;
  dateOfBirth?: string;
  skills?: string[];
};

type StaffSelectorProps = {
  onSelectStaff?: (staff: Staff[]) => void;
};

function getAge(dob?: string) {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export default function StaffSelector({ onSelectStaff }: StaffSelectorProps) {
  const supabase = createClient();

  const [staff, setStaff] = useState<Staff[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadStaff() {
    setLoading(true);
    const { data, error } = await supabase
      .from("staff")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error loading staff", error);
      setStaff([]);
    } else {
      setStaff((data as Staff[]) || []);
    }

    setLoading(false);
  }

  function toggleStaff(id: string) {
    setSelectedIds((prev) => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter((x) => x !== id) : [...prev, id];
      if (onSelectStaff) {
        const selectedStaff = staff.filter((s) => next.includes(s.id));
        onSelectStaff(selectedStaff);
      }
      return next;
    });
  }

  return (
    <div className="border rounded p-4 space-y-3 bg-white">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm">Staff Selector</h2>
        <button
          type="button"
          onClick={loadStaff}
          className="text-xs text-blue-600"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="text-xs text-gray-500">Loading staff…</p>
      ) : staff.length === 0 ? (
        <p className="text-xs text-gray-500">No staff found.</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-auto">
          {staff.map((s) => {
            const selected = selectedIds.includes(s.id);
            const age = getAge(s.dateOfBirth);

            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleStaff(s.id)}
                className={`w-full text-left border rounded px-3 py-2 text-xs ${
                  selected
                    ? "bg-blue-50 border-blue-400"
                    : "bg-white border-gray-200"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium text-sm">{s.name}</span>
                  {selected && (
                    <span className="text-[10px] text-blue-700 font-semibold">
                      Selected
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-gray-500">
                  {s.postcode} • {s.availableStart}–{s.availableEnd}
                </div>

                <div className="text-[11px] text-gray-500">
                  {s.gender && <span>{s.gender}</span>}
                  {s.gender && age && <span>, </span>}
                  {age && <span>{age} yrs</span>}
                </div>

                {s.skills?.length ? (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {s.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="mt-1 text-[10px] text-gray-400">
                    No skills set
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
