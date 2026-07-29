"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAppointmentStore, Appointment } from "@/store/appointmentStore";
import { useExceptionStore } from "@/store/exceptionStore";
import {
  occurrencesBetween,
  toIsoDate,
  type RecurrenceRule,
} from "@/lib/recurrence/occurrences";
import MonthGrid, { buildMonthCells, type DayCell } from "./MonthGrid";

function ruleFor(a: Appointment): RecurrenceRule {
  return {
    freq: a.recurFreq ?? "once",
    interval: a.recurInterval ?? 1,
    weekdays: a.recurWeekdays ?? [],
    // Appointments predating recurrence have no start date. Anchoring them to
    // their own absent date would hide them, so they are treated as one-offs
    // on the grid's first day rather than vanishing.
    startsOn: a.startsOn ?? "1970-01-01",
    endsOn: a.endsOn ?? null,
  };
}

export default function CalendarView({ isFree }: { isFree: boolean }) {
  const { appointments } = useAppointmentStore();
  const { exceptions, forAppointment, skipOccurrence, moveOccurrence, clearException, load } =
    useExceptionStore();

  const todayIso = useMemo(() => toIsoDate(new Date()), []);
  const [cursor, setCursor] = useState(() => ({
    year: Number(todayIso.slice(0, 4)),
    month: Number(todayIso.slice(5, 7)) - 1,
  }));
  const [selected, setSelected] = useState<string | null>(todayIso);
  const [moveTarget, setMoveTarget] = useState<Record<string, string>>({});

  useEffect(() => {
    load(isFree);
  }, [isFree, load]);

  const baseCells = useMemo(
    () => buildMonthCells(cursor.year, cursor.month, todayIso),
    [cursor, todayIso]
  );

  const active = useMemo(
    () => appointments.filter((a) => !a.archived),
    [appointments]
  );

  // Occurrences for the visible range, expanded once and bucketed by date.
  const { byDate, movedIntoDate } = useMemo(() => {
    const from = baseCells[0].iso;
    const to = baseCells[baseCells.length - 1].iso;

    const byDate = new Map<string, Appointment[]>();
    const movedIntoDate = new Map<string, number>();

    for (const a of active) {
      const exs = forAppointment(a.id);
      const dates = occurrencesBetween(ruleFor(a), exs, from, to);
      const movedTargets = new Set(
        exs.filter((e) => e.action === "move" && e.movedToDate).map((e) => e.movedToDate!)
      );

      for (const d of dates) {
        if (!byDate.has(d)) byDate.set(d, []);
        byDate.get(d)!.push(a);
        if (movedTargets.has(d)) {
          movedIntoDate.set(d, (movedIntoDate.get(d) ?? 0) + 1);
        }
      }
    }

    return { byDate, movedIntoDate };
  }, [active, baseCells, exceptions, forAppointment]);

  const cells: DayCell[] = baseCells.map((c) => ({
    ...c,
    names: (byDate.get(c.iso) ?? []).map((a) => a.name),
    movedIn: movedIntoDate.get(c.iso) ?? 0,
  }));

  const monthLabel = new Date(Date.UTC(cursor.year, cursor.month, 1, 12)).toLocaleDateString(
    "en-GB",
    { month: "long", year: "numeric" }
  );

  const step = (delta: number) =>
    setCursor(({ year, month }) => {
      const m = month + delta;
      if (m < 0) return { year: year - 1, month: 11 };
      if (m > 11) return { year: year + 1, month: 0 };
      return { year, month: m };
    });

  const selectedAppointments = selected ? (byDate.get(selected) ?? []) : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-100">{monthLabel}</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Previous month"
            className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => {
              setCursor({
                year: Number(todayIso.slice(0, 4)),
                month: Number(todayIso.slice(5, 7)) - 1,
              });
              setSelected(todayIso);
            }}
            className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Next month"
            className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
          >
            →
          </button>
        </div>
      </div>

      <MonthGrid cells={cells} selectedIso={selected} onSelect={setSelected} />

      {selected && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-100">
              {new Date(`${selected}T12:00:00Z`).toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </h3>
            <Link
              href="/scheduler"
              className="rounded bg-teal-500 px-3 py-1 text-xs font-semibold text-slate-950 hover:bg-teal-400"
            >
              Plan this day
            </Link>
          </div>

          {selectedAppointments.length === 0 ? (
            <p className="text-xs text-slate-400">No visits due.</p>
          ) : (
            <ul className="space-y-2">
              {selectedAppointments.map((a) => {
                const exs = forAppointment(a.id);
                // A moved occurrence shows on its new date; the control there
                // has to clear the exception keyed to the ORIGINAL date.
                const movedHere = exs.find(
                  (e) => e.action === "move" && e.movedToDate === selected
                );
                const key = `${a.id}|${selected}`;

                return (
                  <li
                    key={a.id}
                    className="rounded border border-slate-800 bg-slate-900 px-3 py-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-sm font-medium text-slate-100">
                          {a.name}
                        </span>
                        <span className="ml-2 text-xs text-slate-400">
                          {a.postcode} · {a.durationMinutes} min
                        </span>
                        {movedHere && (
                          <span className="ml-2 text-xs text-amber-300">
                            moved from {movedHere.onDate}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {movedHere ? (
                          <button
                            type="button"
                            onClick={() => clearException(a.id, movedHere.onDate)}
                            className="rounded border border-slate-700 px-2 py-1 text-[11px] text-slate-300 hover:bg-slate-800"
                          >
                            Undo move
                          </button>
                        ) : (
                          <>
                            <input
                              type="date"
                              value={moveTarget[key] ?? ""}
                              onChange={(e) =>
                                setMoveTarget((m) => ({ ...m, [key]: e.target.value }))
                              }
                              aria-label={`Move ${a.name} to a different date`}
                              className="rounded border border-slate-700 bg-slate-900 px-1.5 py-1 text-[11px] text-slate-200"
                            />
                            <button
                              type="button"
                              disabled={!moveTarget[key]}
                              onClick={() =>
                                moveOccurrence(a.id, selected, moveTarget[key])
                              }
                              className="rounded border border-slate-700 px-2 py-1 text-[11px] text-slate-300 hover:bg-slate-800 disabled:opacity-40"
                            >
                              Move
                            </button>
                            <button
                              type="button"
                              onClick={() => skipOccurrence(a.id, selected)}
                              className="rounded border border-slate-700 px-2 py-1 text-[11px] text-slate-300 hover:border-red-500/60 hover:text-red-300"
                            >
                              Skip
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
            Skipping or moving affects only this one occurrence. The rest of the
            series is unchanged.
          </p>
        </div>
      )}
    </div>
  );
}
