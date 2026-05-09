"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

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
  isFree: boolean;
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

function hashColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 55%)`;
}

export default function StaffSelector({ isFree, onSelectStaff }: StaffSelectorProps) {
  const supabase = createSupabaseBrowserClient();

  const [staff, setStaff] = useState<Staff[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // -----------------------------
  // FREE MODE: sessionStorage load
  // -----------------------------
  function loadFreeStaff() {
    const raw = sessionStorage.getItem("free_scheduler_data");
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw);
      return parsed.staff || [];
    } catch {
      return [];
    }
  }

  // -----------------------------
  // FREE MODE: sessionStorage save
  // -----------------------------
  function saveFreeStaff(updated: Staff[]) {
    const raw = sessionStorage.getItem("free_scheduler_data");
    const base = raw ? JSON.parse(raw) : {};

    const updatedData = {
      ...base,
      staff: updated,
    };

    sessionStorage.setItem("free_scheduler_data", JSON.stringify(updatedData));
  }

  // -----------------------------
  // LOAD STAFF (Free or Pro)
  // -----------------------------
  useEffect(() => {
    async function load() {
      setLoading(true);

      if (isFree) {
        const localStaff = loadFreeStaff();
        setStaff(localStaff);
        setLoading(false);
        return;
      }

      // PRO MODE — load from Supabase
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

    load();
  }, [isFree, supabase]);

  // -----------------------------
  // SELECT STAFF
  // -----------------------------
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

  // -----------------------------
  // FREE MODE LIMIT: Max 2 staff
  // -----------------------------
  const freeLimitReached = isFree && staff.length >= 2;

  return (
    <div className="space-y-3 rounded border border-slate-800 bg-slate-950 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-100">Staff selector</h2>

        {!isFree && (
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="text-xs text-sky-400 hover:text-sky-300"
          >
            Refresh
          </button>
        )}
      </div>

      {/* FREE LIMIT WARNING */}
      {isFree && freeLimitReached && (
        <p className="text-[11px] text-amber-300">
          Free limit reached — max 2 staff.
        </p>
      )}

      {loading ? (
        <p className="text-xs text-slate-400">Loading staff…</p>
      ) : staff.length === 0 ? (
        <p className="text-xs text-slate-400">No staff found.</p>
      ) : (
        <div className="max-h-64 space-y-2 overflow-auto">
          {staff.map((s) => {
            const selected = selectedIds.includes(s.id);
            const age = getAge(s.dateOfBirth);
            const color = hashColor(s.id);

            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleStaff(s.id)}
                className={`w-full rounded border px-3 py-2 text-left text-xs transition-colors ${
                  selected
                    ? "border-sky-500/70 bg-sky-500/10"
                    : "border-slate-800 bg-slate-900 hover:bg-slate-800/80"
                }`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-sm font-medium text-slate-100">
                      {s.name}
                    </span>
                  </div>

                  {selected && (
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-sky-300">
                      Selected
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-slate-400">
                  {s.postcode} • {s.availableStart}–{s.availableEnd}
                </div>

                <div className="text-[11px] text-slate-400">
                  {s.gender && <span>{s.gender}</span>}
                  {s.gender && age && <span>, </span>}
                  {age && <span>{age} yrs</span>}
                </div>

                {s.skills?.length ? (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {s.skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="mt-1 text-[10px] text-slate-500">
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
