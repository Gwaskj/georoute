"use client";

import { toIsoDate, isoWeekday } from "@/lib/recurrence/occurrences";

export interface DayCell {
  iso: string;
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

/**
 * The six-week grid containing a month, starting Monday.
 *
 * Always six weeks so the grid does not change height as you page through
 * months, which is far less jarring than a layout that jumps.
 */
export function buildMonthCells(
  year: number,
  monthIndex: number,
  todayIso: string
): { iso: string; inMonth: boolean; isToday: boolean }[] {
  const first = utc(year, monthIndex, 1);
  const gridStart = new Date(first.getTime());
  gridStart.setUTCDate(gridStart.getUTCDate() - (isoWeekday(first) - 1));

  const cells: { iso: string; inMonth: boolean; isToday: boolean }[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart.getTime());
    d.setUTCDate(d.getUTCDate() + i);
    const iso = toIsoDate(d);
    cells.push({
      iso,
      inMonth: d.getUTCMonth() === monthIndex,
      isToday: iso === todayIso,
    });
  }
  return cells;
}

export default function MonthGrid({
  cells,
  selectedIso,
  onSelect,
}: {
  cells: DayCell[];
  selectedIso: string | null;
  onSelect: (iso: string) => void;
}) {
  return (
    <div>
      <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-widest text-slate-500">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell) => {
          const selected = cell.iso === selectedIso;
          const count = cell.names.length;

          return (
            <button
              key={cell.iso}
              type="button"
              onClick={() => onSelect(cell.iso)}
              aria-current={cell.isToday ? "date" : undefined}
              className={`min-h-[74px] rounded border p-1.5 text-left align-top transition-colors ${
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
                  {Number(cell.iso.slice(8, 10))}
                </span>
                {count > 0 && (
                  <span className="rounded bg-slate-700 px-1 text-[10px] text-slate-200">
                    {count}
                  </span>
                )}
              </div>

              <div className="space-y-0.5">
                {cell.names.slice(0, 2).map((n, i) => (
                  <div
                    key={`${cell.iso}-${i}`}
                    className="truncate text-[10px] text-slate-300"
                  >
                    {n}
                  </div>
                ))}
                {count > 2 && (
                  <div className="text-[10px] text-slate-500">
                    +{count - 2} more
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
