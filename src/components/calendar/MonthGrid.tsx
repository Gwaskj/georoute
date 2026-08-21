"use client";

import { toIsoDate, isoWeekday } from "@/lib/recurrence/occurrences";

export type CalendarView = "month" | "week" | "workweek" | "day";

export interface DayCell {
  iso: string;
  /** False for the leading/trailing days a month grid borrows from its neighbours. */
  inMonth: boolean;
  isToday: boolean;
  /** Client names due that day, already resolved from recurrence. */
  names: string[];
  /** How many of those were moved onto this date from elsewhere. */
  movedIn: number;
}

/** Noon UTC throughout, so no date can drift across a day boundary. */
function utc(y: number, m: number, d: number): Date {
  return new Date(Date.UTC(y, m, d, 12));
}

function addDays(d: Date, n: number): Date {
  const out = new Date(d.getTime());
  out.setUTCDate(out.getUTCDate() + n);
  return out;
}

/** Monday of the week containing the given date. */
export function startOfWeek(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  const date = utc(y, m - 1, d);
  return addDays(date, -(isoWeekday(date) - 1));
}

/**
 * The dates a view covers, given the date it is anchored on.
 *
 * Month is always six weeks so the grid does not change height while paging,
 * which is far less jarring than a layout that jumps between months.
 */
export function buildCells(
  view: CalendarView,
  anchorIso: string,
  todayIso: string
): { iso: string; inMonth: boolean; isToday: boolean }[] {
  const [y, m] = anchorIso.split("-").map(Number);
  const monthIndex = m - 1;

  let start: Date;
  let count: number;

  if (view === "month") {
    const first = utc(y, monthIndex, 1);
    start = addDays(first, -(isoWeekday(first) - 1));
    count = 42;
  } else if (view === "day") {
    const [yy, mm, dd] = anchorIso.split("-").map(Number);
    start = utc(yy, mm - 1, dd);
    count = 1;
  } else {
    // week and workweek both begin on the Monday; workweek simply stops early.
    start = startOfWeek(anchorIso);
    count = view === "workweek" ? 5 : 7;
  }

  const cells: { iso: string; inMonth: boolean; isToday: boolean }[] = [];
  for (let i = 0; i < count; i++) {
    const d = addDays(start, i);
    const iso = toIsoDate(d);
    cells.push({
      iso,
      // Only the month view borrows days from neighbouring months, so every
      // other view treats all of its cells as belonging to it.
      inMonth: view === "month" ? d.getUTCMonth() === monthIndex : true,
      isToday: iso === todayIso,
    });
  }
  return cells;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function MonthGrid({
  cells,
  view,
  selectedIso,
  onSelect,
}: {
  cells: DayCell[];
  view: CalendarView;
  selectedIso: string | null;
  onSelect: (iso: string) => void;
}) {
  const columns = view === "workweek" ? 5 : view === "day" ? 1 : 7;
  const gridCols =
    columns === 5 ? "grid-cols-5" : columns === 1 ? "grid-cols-1" : "grid-cols-7";

  // A week shows only a handful of days, so each cell can afford to be taller
  // and list more of what is in it.
  const minHeight = view === "month" ? "min-h-[74px]" : "min-h-[150px]";
  const maxNames = view === "month" ? 2 : 6;

  return (
    <div>
      {view !== "day" && (
        <div className={`mb-1 grid ${gridCols} gap-1 text-center text-[10px] uppercase tracking-widest text-slate-400`}>
          {DAY_LABELS.slice(0, columns).map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
      )}

      <div className={`grid ${gridCols} gap-1`}>
        {cells.map((cell) => {
          const selected = cell.iso === selectedIso;
          const count = cell.names.length;

          return (
            <button
              key={cell.iso}
              type="button"
              onClick={() => onSelect(cell.iso)}
              aria-current={cell.isToday ? "date" : undefined}
              // flex-col because a button centres its content vertically by
              // default, which pushes the date into the middle of a tall cell.
              className={`${minHeight} flex flex-col items-stretch rounded border p-1.5 text-left transition-colors ${
                selected
                  ? "border-sky-500 bg-sky-500/10"
                  : cell.isToday
                    ? "border-teal-600/60 bg-slate-900"
                    : "border-slate-800 bg-slate-900/50 hover:bg-slate-900"
              } ${cell.inMonth ? "" : "opacity-40"}`}
            >
              <div className="mb-1 flex items-center justify-between">
                <span
                  className={`text-[11px] ${
                    cell.isToday ? "font-semibold text-teal-300" : "text-slate-400"
                  }`}
                >
                  {view === "month"
                    ? Number(cell.iso.slice(8, 10))
                    : new Date(`${cell.iso}T12:00:00Z`).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}
                </span>
                {count > 0 && (
                  <span className="rounded bg-slate-700 px-1 text-[10px] text-slate-200">
                    {count}
                  </span>
                )}
              </div>

              <div className="space-y-0.5">
                {cell.names.slice(0, maxNames).map((n, i) => (
                  <div
                    key={`${cell.iso}-${i}`}
                    className="truncate text-[10px] text-slate-300"
                  >
                    {n}
                  </div>
                ))}
                {count > maxNames && (
                  <div className="text-[10px] text-slate-400">
                    +{count - maxNames} more
                  </div>
                )}
                {cell.movedIn > 0 && (
                  <div className="text-[10px] text-amber-400">
                    {cell.movedIn} moved
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
