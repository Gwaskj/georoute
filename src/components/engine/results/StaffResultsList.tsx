"use client";

import type { ReactNode } from "react";
import { ScheduledVisit } from "@/lib/scheduler/types";
import { Staff } from "@/store/staffStore";
import { LEG_COLORS } from "@/lib/map/legColors";
import { StaffLeg } from "@/lib/map/useStaffLegSchedule";

interface StaffResultsListProps {
  staff: Staff[];
  visits: ScheduledVisit[];
  dayStart: string; // "06:00"
  dayEnd: string;   // "22:00"
  selectedStaffId: string | null;
  onSelectStaff: (staffId: string | null) => void;
  selectedVisitId: string | null;
  onSelectVisit: (visitId: string | null) => void;
  staffLegSchedule?: StaffLeg[];
  legScheduleLoading?: boolean;
}

const fmtClock = (d: Date) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

function TravelRow({ leg }: { leg: StaffLeg }) {
  return (
    <div className="flex items-center justify-between px-2 py-0.5 text-[10px] text-slate-500">
      <span>
        🚗 {leg.travelMinutes != null ? `${leg.travelMinutes} min · ${leg.distanceMiles} mi` : "calculating…"} from {leg.fromLabel}
      </span>
      {leg.arrivalTime && <span>arrives {fmtClock(leg.arrivalTime)}</span>}
    </div>
  );
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
  selectedVisitId,
  onSelectVisit,
  staffLegSchedule,
  legScheduleLoading,
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
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectStaff(isSelected ? null : s.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelectStaff(isSelected ? null : s.id);
                    }
                  }}
                  className={`flex w-full flex-col rounded border px-3 py-2 text-left transition-colors cursor-pointer ${
                    isSelected
                      ? "border-sky-500/70 bg-sky-500/10"
                      : "border-slate-800 bg-slate-900 hover:bg-slate-800/80"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-3 w-3 flex-shrink-0 rounded-full"
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
                      Potentially could have taken more calls.
                    </p>
                  ) : (
                    <p className="mt-1 text-[11px] text-emerald-300">
                      Fully utilised.
                    </p>
                  )}

                  {isSelected && count > 0 && (() => {
                    const staffLegs = staffLegSchedule ?? [];
                    const firstLeg = staffLegs[0];
                    const lastLeg = staffLegs[staffLegs.length - 1];
                    return (
                      <>
                        {(firstLeg || lastLeg) && (
                          <p className="mt-2 border-t border-slate-700/60 pt-2 text-[11px] text-slate-400">
                            Starts at <span className="font-medium text-slate-200">{firstLeg?.fromLabel ?? "…"}</span>
                            {" · "}
                            Finishes at <span className="font-medium text-slate-200">{lastLeg?.toLabel ?? "…"}</span>
                          </p>
                        )}
                        <ul className="mt-2 space-y-1">
                          {legScheduleLoading && (
                            <li className="px-2 text-[10px] text-slate-500">
                              Calculating travel times…
                            </li>
                          )}
                          {(() => {
                            const sortedVisits = [...staffVisits].sort(
                              (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
                            );
                            const items: ReactNode[] = [];

                            sortedVisits.forEach((v, i) => {
                              const fmt = (d: Date) =>
                                d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                              const isVisitSelected = selectedVisitId === v.id;
                              const legColor = LEG_COLORS[i % LEG_COLORS.length];
                              const durationMins = Math.round(
                                (new Date(v.end).getTime() - new Date(v.start).getTime()) / 60000
                              );
                              const arrivalLeg = staffLegs.find((l) => l.toVisitId === v.id);

                              if (arrivalLeg) {
                                items.push(
                                  <li key={`${v.id}-travel`}>
                                    <TravelRow leg={arrivalLeg} />
                                  </li>
                                );
                              }

                              items.push(
                                <li key={v.id}>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onSelectVisit(isVisitSelected ? null : v.id);
                                    }}
                                    style={{ borderLeftColor: legColor }}
                                    className={`flex w-full items-center justify-between rounded border-l-[3px] px-2 py-1 text-[11px] text-left transition-colors ${
                                      isVisitSelected
                                        ? "bg-sky-500/20 ring-1 ring-sky-500/50"
                                        : "bg-slate-800/60 hover:bg-slate-700/60"
                                    }`}
                                  >
                                    <span className="font-medium text-slate-100">{v.clientName}</span>
                                    <div className="flex items-center gap-2 text-slate-400">
                                      <span>{v.postcode}</span>
                                      <span>
                                        {fmt(new Date(v.start))}–{fmt(new Date(v.end))} ({durationMins} min)
                                      </span>
                                    </div>
                                  </button>
                                </li>
                              );

                              if (i === sortedVisits.length - 1) {
                                const returnLeg = staffLegs.find((l) => l.fromVisitId === v.id);
                                if (returnLeg) {
                                  items.push(
                                    <li key={`${v.id}-return`}>
                                      <div className="flex items-center justify-between px-2 py-0.5 text-[10px] text-slate-500">
                                        <span>
                                          🚗 {returnLeg.travelMinutes != null
                                            ? `${returnLeg.travelMinutes} min · ${returnLeg.distanceMiles} mi`
                                            : "calculating…"}{" "}
                                          → return to {returnLeg.toLabel}
                                        </span>
                                        {returnLeg.arrivalTime && (
                                          <span>arrives {fmtClock(returnLeg.arrivalTime)}</span>
                                        )}
                                      </div>
                                    </li>
                                  );
                                }
                              }
                            });

                            return items;
                          })()}
                        </ul>
                      </>
                    );
                  })()}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
