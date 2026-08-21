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
import MonthGrid, {
  buildCells,
  type DayCell,
  type CalendarView as ViewMode,
} from "./MonthGrid";

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

export default function CalendarView() {
  const { appointments } = useAppointmentStore();
  const { exceptions, forAppointment, skipOccurrence, moveOccurrence, clearException, load } =
    useExceptionStore();

  const todayIso = useMemo(() => toIsoDate(new Date()), []);
  const [view, setView] = useState<ViewMode>("month");
  // A single anchor date drives every view; each one just covers a different
  // span around it, and stepping moves by that view's own unit.
  const [anchor, setAnchor] = useState(todayIso);
  const [selected, setSelected] = useState<string | null>(todayIso);
  const [moveTarget, setMoveTarget] = useState<Record<string, string>>({});

  useEffect(() => {
    load();
  }, [load]);

  const baseCells = useMemo(
    () => buildCells(view, anchor, todayIso),
    [view, anchor, todayIso]
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

  const rangeLabel = (() => {
    const d = (iso: string) => new Date(`${iso}T12:00:00Z`);
    if (view === "month") {
      return d(anchor).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    }
    if (view === "day") {
      return d(anchor).toLocaleDateString("en-GB", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      });
    }
    // A week can straddle two months, so show both ends rather than guessing.
    const first = baseCells[0].iso;
    const last = baseCells[baseCells.length - 1].iso;
    const opts = { day: "numeric", month: "short" } as const;
    const from = d(first).toLocaleDateString("en-GB", opts);
    const to = d(last).toLocaleDateString("en-GB", { ...opts, year: "numeric" });
    return `${from} – ${to}`;
  })();

  // Each view steps by its own unit: a month, a week, or a day.
  const step = (delta: number) =>
    setAnchor((current) => {
      const [y, m, dd] = current.split("-").map(Number);
      const d = new Date(Date.UTC(y, m - 1, dd, 12));
      if (view === "month") d.setUTCMonth(d.getUTCMonth() + delta);
      else if (view === "day") d.setUTCDate(d.getUTCDate() + delta);
      else d.setUTCDate(d.getUTCDate() + delta * 7);
      return toIsoDate(d);
    });

  const VIEWS: { id: ViewMode; label: string }[] = [
    { id: "month", label: "Month" },
    { id: "week", label: "Week" },
    { id: "workweek", label: "Working week" },
    { id: "day", label: "Day" },
  ];

  // In day view there is no grid to click, so the panel follows the anchor.
  // Elsewhere it follows the selected cell -- but only while that cell is
  // actually on screen. Paging away otherwise left the panel describing a day
  // the grid no longer showed.
  const focusedIso = (() => {
    if (view === "day") return anchor;
    const visible = new Set(baseCells.map((c) => c.iso));
    if (selected && visible.has(selected)) return selected;
    return visible.has(todayIso) ? todayIso : baseCells[0].iso;
  })();
  const selectedAppointments = focusedIso ? (byDate.get(focusedIso) ?? []) : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-100">{rangeLabel}</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Previous"
            className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => {
              setAnchor(todayIso);
              setSelected(todayIso);
            }}
            className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Next"
            className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
          >
            →
          </button>
        </div>
      </div>

      <div
        role="group"
        aria-label="Calendar view"
        className="flex flex-wrap gap-1"
      >
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            aria-pressed={view === v.id}
            // The anchor is left alone: it already tracks the period being
            // viewed, including after paging. Re-pointing it at 'selected'
            // here sent you back to whichever date was last clicked.
            onClick={() => setView(v.id)}
            className={`rounded border px-3 py-1 text-xs transition-colors ${
              view === v.id
                ? "border-teal-500 bg-teal-500/15 text-teal-200"
                : "border-slate-700 text-slate-300 hover:bg-slate-800"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* The day view's single cell would just repeat the detail panel below. */}
      {view !== "day" && (
        <MonthGrid
          cells={cells}
          view={view}
          selectedIso={selected}
          onSelect={(iso) => {
            setSelected(iso);
            // Also the anchor, so switching to week or day view lands on the
            // day just clicked rather than wherever the period started.
            setAnchor(iso);
          }}
        />
      )}

      {focusedIso && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-100">
              {new Date(`${focusedIso}T12:00:00Z`).toLocaleDateString("en-GB", {
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
                  (e) => e.action === "move" && e.movedToDate === focusedIso
                );
                const key = `${a.id}|${focusedIso}`;

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
                                moveOccurrence(a.id, focusedIso, moveTarget[key])
                              }
                              className="rounded border border-slate-700 px-2 py-1 text-[11px] text-slate-300 hover:bg-slate-800 disabled:opacity-40"
                            >
                              Move
                            </button>
                            <button
                              type="button"
                              onClick={() => skipOccurrence(a.id, focusedIso)}
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

          <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
            Skipping or moving affects only this one occurrence. The rest of the
            series is unchanged.
          </p>
        </div>
      )}
    </div>
  );
}
