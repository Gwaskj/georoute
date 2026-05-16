"use client";

import { ScheduledVisit } from "@/lib/scheduler/types";
import { Staff } from "@/store/staffStore";

interface StaffResultsListProps {
  staff: Staff[];
  visits: ScheduledVisit[];
  dayStart: string; // "06:00"
  dayEnd: string;   // "22:00"
  selectedStaffId: string | null;
  onSelectStaff: (staffId: string | null) => void;
}

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map((v) => parseInt(v, 10));
  return h * 60 + m;
}

function getGapsInMinutes(
  visits: ScheduledVisit[],
  dayStart: string,
  dayEnd: string
): number[] {
  if (visits.length === 0) return [];

  const sorted = [...visits].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );

  const gaps: number[] = [];
  const dayStartMin = toMinutes(dayStart);
  const dayEndMin = toMinutes(dayEnd);

  const firstStartMin =
    new Date(sorted[0].start).getHours() * 60 +
    new Date(sorted[0].start).getMinutes();
  if (firstStartMin > dayStartMin) {
    gaps.push(firstStartMin - dayStartMin);
  }

  for (let i = 0; i < sorted.length - 1; i++) {
    const end = new Date(sorted[i].end);
    const nextStart = new Date(sorted[i + 1].start);
    const gap = (nextStart.getTime() - end.getTime()) / (1000 * 60);
    if (gap > 0) gaps.push(gap);
  }

  const lastEndMin =
    new Date(sorted[sorted.length - 1].end).getHours() * 60 +
    new Date(sorted[sorted.length - 1].end).getMinutes();
  if (dayEndMin > lastEndMin) {
    gaps.push(dayEndMin - lastEndMin);
  }

  return gaps;
}

export default function StaffResultsList({
  staff,
  visits,
  dayStart,
  dayEnd,
  selectedStaffId,
  onSelectStaff,
}: StaffResultsListProps) {
  const visitsByStaff = staff.reduce<Record<string, ScheduledVisit[]>>(
    (acc, s) => {
      acc[s.id] = visits.filter((v) => v.staffId === s.id);
      return acc;
    },
    {}
  );

  const sortedStaff = [...staff].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return (
    <div className="h-full rounded border border-slate-800 bg-slate-950 p-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-100">
        Staff results
      </h2>

      {sortedStaff.length === 0 ? (
        <p className="text-xs text-slate-400">No staff configured.</p>
      ) : (
        <ul className="space-y-2 text-xs">
          {sortedStaff.map((s) => {
            const staffVisits = visitsByStaff[s.id] || [];
            const count = staffVisits.length;

            const gaps = getGapsInMinutes(staffVisits, dayStart, dayEnd);
            const hasBigGap = gaps.some((g) => g >= 30);

            const isSelected = selectedStaffId === s.id;

            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() =>
                    onSelectStaff(isSelected ? null : s.id)
                  }
                  className={`flex w-full flex-col rounded border px-3 py-2 text-left transition-colors ${
                    isSelected
                      ? "border-sky-500/70 bg-sky-500/10"
                      : "border-slate-800 bg-slate-900 hover:bg-slate-800/80"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {/* ⭐ NEW: Staff colour dot */}
                      <span
                        className="inline-block h-3 w-3 rounded-full"
                        style={{ backgroundColor: s.colour }}
                      />
                      <span className="text-sm font-medium text-slate-100">
                        {s.name}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-300">
                      {count} appointment{count === 1 ? "" : "s"}
                    </span>
                  </div>

                  {count === 0 ? (
                    <p className="mt-1 text-[11px] text-slate-500">
                      No appointments allocated.
                    </p>
                  ) : hasBigGap ? (
                    <p className="mt-1 text-[11px] text-amber-300">
                      Potentially could have taken more calls (depending on
                      care‑call location and requirements).
                    </p>
                  ) : (
                    <p className="mt-1 text-[11px] text-emerald-300">
                      Fully utilised.
                    </p>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
