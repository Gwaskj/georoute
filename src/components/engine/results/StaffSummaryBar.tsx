"use client";

import { ScheduledVisit } from "@/lib/scheduler/types";
import { Staff } from "@/store/staffStore";

interface StaffSummaryBarProps {
  staff: Staff | null;
  visits: ScheduledVisit[];
  dayStart: string;
  dayEnd: string;
  totalMiles?: number; // you can pass real distance from your existing engine
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toMinutesFromDate(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map((v) => parseInt(v, 10));
  return h * 60 + m;
}

export default function StaffSummaryBar({
  staff,
  visits,
  dayStart,
  dayEnd,
  totalMiles,
}: StaffSummaryBarProps) {
  if (!staff) return null;

  if (visits.length === 0) {
    return (
      <div className="mt-2 rounded border border-slate-800 bg-slate-950 px-4 py-2 text-xs text-slate-300">
        {staff.name} has no appointments allocated.
      </div>
    );
  }

  const sorted = [...visits].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );

  const firstStart = new Date(sorted[0].start);
  const lastEnd = new Date(sorted[sorted.length - 1].end);

  const workingStartStr = formatTime(firstStart);
  const workingEndStr = formatTime(lastEnd);

  const dayStartMin = toMinutes(dayStart);
  const dayEndMin = toMinutes(dayEnd);

  const firstStartMin = toMinutesFromDate(firstStart);
  const lastEndMin = toMinutesFromDate(lastEnd);

  let idleMinutes = 0;

  if (firstStartMin > dayStartMin) {
    idleMinutes += firstStartMin - dayStartMin;
  }

  for (let i = 0; i < sorted.length - 1; i++) {
    const end = new Date(sorted[i].end);
    const nextStart = new Date(sorted[i + 1].start);
    const gap = (nextStart.getTime() - end.getTime()) / (1000 * 60);
    if (gap > 0) idleMinutes += gap;
  }

  if (dayEndMin > lastEndMin) {
    idleMinutes += dayEndMin - lastEndMin;
  }

  const roundedIdleMinutes = Math.round(idleMinutes);
  const hours = Math.floor(roundedIdleMinutes / 60);
  const mins = roundedIdleMinutes % 60;
  const idleLabel = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  const hasBigGap = idleMinutes >= 30;

  return (
    <div className="mt-2 rounded border border-slate-800 bg-slate-950 px-4 py-2 text-xs text-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-2">

        {/* ⭐ NEW: Staff colour dot */}
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: staff.colour }}
          />
          <span className="font-semibold">{staff.name}</span>
        </div>

        <span>
          has{" "}
          <span className="font-semibold">
            {visits.length} appointment{visits.length === 1 ? "" : "s"}
          </span>
          .
        </span>

        <span>
          Working{" "}
          <span className="font-semibold">
            {workingStartStr} → {workingEndStr}
          </span>
          .
        </span>

        {typeof totalMiles === "number" && (
          <span>
            Total travel:{" "}
            <span className="font-semibold">
              {totalMiles.toFixed(1)} miles
            </span>
            .
          </span>
        )}

        <span>
          Idle time:{" "}
          <span className="font-semibold">{idleLabel}</span>{" "}
          {hasBigGap && (
            <span className="text-amber-300">
              (potentially could have taken more calls, depending on
              care‑call location and requirements)
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
