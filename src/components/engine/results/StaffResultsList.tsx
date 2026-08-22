"use client";

import type { ReactNode } from "react";
import { ScheduledVisit, ScheduledBreak } from "@/lib/scheduler/types";
import { Staff } from "@/store/staffStore";
import { LEG_COLORS } from "@/lib/map/legColors";
import { StaffLeg, RETURN_TO_BASE_ID } from "@/lib/map/useStaffLegSchedule";
import RouteLinks from "./RouteLinks";
import ShareRoundButton from "./ShareRoundButton";
import { wazeUrl, type NavStop } from "@/lib/navigation/mapLinks";

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
  breaks?: ScheduledBreak[];
}

const fmtClock = (d: Date) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

function TravelRow({ leg }: { leg: StaffLeg }) {
  return (
    <div className="flex items-center justify-between px-2 py-0.5 text-[10px] text-slate-400">
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
  breaks = [],
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
                {/* A disclosure, not a clickable card.
                 *
                 * The whole card used to be one div with role="button", and the
                 * expanded round -- with its own Waze links and a Share button
                 * -- sat inside it. Nesting controls inside a control is
                 * ambiguous to a screen reader and awkward from the keyboard,
                 * and it meant every child had to stopPropagation to avoid
                 * collapsing the panel it lived in.
                 *
                 * Only the summary is the control now. A real <button> also
                 * brings Enter and Space handling with it, so the hand-rolled
                 * onKeyDown is gone, and aria-expanded announces the state
                 * rather than leaving it to be inferred from the layout. */}
                <div
                  className={`overflow-hidden rounded border transition-colors ${
                    isSelected
                      ? "border-sky-500/70 bg-sky-500/10"
                      : "border-slate-800 bg-slate-900"
                  }`}
                >
                <button
                  type="button"
                  onClick={() => onSelectStaff(isSelected ? null : s.id)}
                  aria-expanded={isSelected}
                  aria-controls={`staff-round-${s.id}`}
                  className={`flex w-full flex-col px-3 py-2 text-left transition-colors ${
                    isSelected ? "" : "hover:bg-slate-800/80"
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
                    <p className="mt-1 text-[11px] text-slate-400">
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
                </button>

                <div id={`staff-round-${s.id}`} className="px-3 pb-2">
                  {isSelected && count > 0 && (() => {
                    const staffLegs = staffLegSchedule ?? [];
                    const firstLeg = staffLegs[0];
                    const lastLeg = staffLegs[staffLegs.length - 1];
                    const isReturnSelected = selectedVisitId === RETURN_TO_BASE_ID;

                    const sortedVisits = [...staffVisits].sort(
                      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
                    );

                    const staffBreaks = breaks
                      .filter((b) => b.staffId === s.id)
                      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

                    // Start and finish come from the leg schedule, which is what
                    // knows whether this person began at home or the office.
                    const navOrigin: NavStop | null = firstLeg?.fromPostcode
                      ? { label: firstLeg.fromLabel, postcode: firstLeg.fromPostcode }
                      : null;
                    const navDestination: NavStop | null = lastLeg?.toPostcode
                      ? { label: lastLeg.toLabel, postcode: lastLeg.toPostcode }
                      : null;
                    const navStops: NavStop[] = sortedVisits
                      .filter((v) => v.postcode)
                      .map((v) => ({ label: v.clientName, postcode: v.postcode }));
                    return (
                      <>
                        <ul className="mt-2 space-y-1 border-t border-slate-700/60 pt-2">
                          {/* Start: where the staff member's day begins. Not
                              clickable — there's no "route to the start". */}
                          <li>
                            <div
                              style={{ borderLeftColor: "#9ca3af" }}
                              className="flex w-full items-center justify-between rounded border-l-[3px] bg-slate-800/40 px-2 py-1 text-left text-[11px]"
                            >
                              <span className="font-medium text-slate-100">
                                Start — {firstLeg?.fromLabel ?? "…"}
                              </span>
                              <div className="flex items-center gap-2 text-slate-400">
                                {firstLeg?.fromPostcode && <span>{firstLeg.fromPostcode}</span>}
                                {firstLeg?.departureTime && (
                                  <span>departs {fmtClock(firstLeg.departureTime)}</span>
                                )}
                              </div>
                            </div>
                          </li>
                          {legScheduleLoading && (
                            <li className="px-2 text-[10px] text-slate-400">
                              Calculating travel times…
                            </li>
                          )}
                          {(() => {
                            const items: ReactNode[] = [];
                            const fmtT = (d: Date) =>
                              d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

                            // Breaks are interleaved by start time so the list
                            // reads as the day actually runs.
                            let breakIdx = 0;
                            const flushBreaksBefore = (limit: number) => {
                              while (
                                breakIdx < staffBreaks.length &&
                                new Date(staffBreaks[breakIdx].start).getTime() <= limit
                              ) {
                                const br = staffBreaks[breakIdx++];
                                const mins = Math.round(
                                  (new Date(br.end).getTime() - new Date(br.start).getTime()) / 60000
                                );
                                items.push(
                                  <li key={br.id}>
                                    <div className="flex w-full items-center justify-between rounded border-l-[3px] border-l-amber-500/70 bg-amber-500/10 px-2 py-1 text-[11px]">
                                      <span className="font-medium text-amber-200">Break</span>
                                      <div className="flex items-center gap-2 text-amber-200/70">
                                        <span>
                                          {fmtT(new Date(br.start))}–{fmtT(new Date(br.end))} ({mins} min)
                                        </span>
                                      </div>
                                    </div>
                                  </li>
                                );
                              }
                            };

                            sortedVisits.forEach((v, i) => {
                              flushBreaksBefore(new Date(v.start).getTime());
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
                                // The Waze link sits beside the row rather than
                                // inside it -- an <a> nested in a <button> is
                                // invalid and breaks keyboard activation.
                                <li key={v.id} className="flex items-stretch gap-1">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onSelectVisit(isVisitSelected ? null : v.id)
                                    }
                                    style={{ borderLeftColor: legColor }}
                                    className={`flex min-w-0 flex-1 items-center justify-between rounded border-l-[3px] px-2 py-1 text-[11px] text-left transition-colors ${
                                      isVisitSelected
                                        ? "bg-sky-500/20 ring-1 ring-sky-500/50"
                                        : "bg-slate-800/60 hover:bg-slate-700/60"
                                    }`}
                                  >
                                    <span className="truncate font-medium text-slate-100">{v.clientName}</span>
                                    <div className="flex flex-shrink-0 items-center gap-2 text-slate-400">
                                      <span>{v.postcode}</span>
                                      <span>
                                        {fmt(new Date(v.start))}–{fmt(new Date(v.end))} ({durationMins} min)
                                      </span>
                                    </div>
                                  </button>
                                  {v.postcode && (
                                    <a
                                      href={wazeUrl({ label: v.clientName, postcode: v.postcode })}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title={`Navigate to ${v.clientName} in Waze`}
                                      className="flex flex-shrink-0 items-center rounded border border-slate-700 bg-slate-800 px-1.5 text-[10px] text-slate-300 transition-colors hover:border-slate-600 hover:bg-slate-700 hover:text-slate-100"
                                    >
                                      Waze
                                    </a>
                                  )}
                                </li>
                              );

                              if (i === sortedVisits.length - 1) {
                                const returnLeg = staffLegs.find((l) => l.fromVisitId === v.id);
                                if (returnLeg) {
                                  items.push(
                                    <li key={`${v.id}-return`}>
                                      <TravelRow leg={returnLeg} />
                                    </li>
                                  );
                                }
                              }
                            });

                            // Any break falling after the last visit.
                            flushBreaksBefore(Infinity);

                            return items;
                          })()}
                          {/* Finish: where the staff member's day ends. Clickable —
                              selects the final leg, last appointment to home/office. */}
                          {lastLeg && (
                            <li>
                              <button
                                type="button"
                                onClick={() =>
                                  onSelectVisit(isReturnSelected ? null : RETURN_TO_BASE_ID)
                                }
                                style={{ borderLeftColor: LEG_COLORS[staffVisits.length % LEG_COLORS.length] }}
                                className={`flex w-full items-center justify-between rounded border-l-[3px] px-2 py-1 text-left text-[11px] transition-colors ${
                                  isReturnSelected
                                    ? "bg-sky-500/20 ring-1 ring-sky-500/50"
                                    : "bg-slate-800/60 hover:bg-slate-700/60"
                                }`}
                              >
                                <span className="font-medium text-slate-100">
                                  Finish — {lastLeg.toLabel}
                                </span>
                                <div className="flex items-center gap-2 text-slate-400">
                                  {lastLeg.toPostcode && <span>{lastLeg.toPostcode}</span>}
                                  {lastLeg.arrivalTime && (
                                    <span>arrives {fmtClock(lastLeg.arrivalTime)}</span>
                                  )}
                                </div>
                              </button>
                            </li>
                          )}
                        </ul>

                        <RouteLinks
                          origin={navOrigin}
                          stops={navStops}
                          destination={navDestination}
                        />

                        <ShareRoundButton
                          staffName={s.name}
                          origin={navOrigin}
                          destination={navDestination}
                          visits={sortedVisits}
                          breaks={staffBreaks}
                        />
                      </>
                    );
                  })()}
                </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
