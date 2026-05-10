"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useHighlightStore } from "@/lib/map/highlightStore";

type ScheduleTableProps = {
  isFree: boolean;
  showTimes?: boolean;
};

type StaffMember = {
  id: string;
  name: string;
};

type Client = {
  id: string;
  name: string;
};

type AppointmentRow = {
  id: string;
  start_time: string | null;
  end_time: string | null;
  staff: StaffMember[];
  clients: Client[];
};

function hashColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 55%)`;
}

function hasConflict(a: AppointmentRow, b: AppointmentRow): boolean {
  if (!a.start_time || !a.end_time || !b.start_time || !b.end_time) return false;

  const aStart = new Date(a.start_time).getTime();
  const aEnd = new Date(a.end_time).getTime();
  const bStart = new Date(b.start_time).getTime();
  const bEnd = new Date(b.end_time).getTime();

  if (aEnd <= bStart || bEnd <= aStart) return false;

  const aStaffIds = new Set(a.staff.map((s) => s.id));
  return b.staff.some((s) => aStaffIds.has(s.id));
}

// ⭐ FIX: Create Supabase client ONCE
const supabase = createSupabaseBrowserClient();

export default function ScheduleTable({ isFree, showTimes = true }: ScheduleTableProps) {
  const highlightedAppointmentId = useHighlightStore((s) => s.highlightedAppointmentId);
  const setHighlightedAppointment = useHighlightStore((s) => s.setHighlightedAppointment);

  const [rows, setRows] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(true);

  function loadFreeAppointments(): AppointmentRow[] {
    const raw = sessionStorage.getItem("free_scheduler_data");
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw);
      return parsed.appointments || [];
    } catch {
      return [];
    }
  }

  useEffect(() => {
    async function load() {
      setLoading(true);

      if (isFree) {
        const local = loadFreeAppointments();
        setRows(local);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("appointments")
        .select(
          `
          id,
          start_time,
          end_time,
          staff:staff_id ( id, name ),
          clients:client_id ( id, name )
        `
        )
        .order("start_time", { ascending: true });

      if (error) {
        console.error("Error loading schedule:", error);
        setRows([]);
        setLoading(false);
        return;
      }

      const normalized: AppointmentRow[] = (data ?? []).map((row: any) => ({
        id: row.id,
        start_time: row.start_time,
        end_time: row.end_time,
        staff: Array.isArray(row.staff) ? row.staff : row.staff ? [row.staff] : [],
        clients: Array.isArray(row.clients) ? row.clients : row.clients ? [row.clients] : [],
      }));

      setRows(normalized);
      setLoading(false);
    }

    load();

    if (!isFree) {
      const channel = supabase
        .channel("schedule-table-engine")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "appointments" },
          () => load()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isFree]);

  const conflictIds = useMemo(() => {
    const ids = new Set<string>();
    for (let i = 0; i < rows.length; i++) {
      for (let j = i + 1; j < rows.length; j++) {
        if (hasConflict(rows[i], rows[j])) {
          ids.add(rows[i].id);
          ids.add(rows[j].id);
        }
      }
    }
    return ids;
  }, [rows]);

  if (loading) {
    return (
      <div className="w-full rounded border border-slate-800 bg-slate-950 p-4">
        <p className="text-sm text-slate-300">Loading schedule…</p>
      </div>
    );
  }

  return (
    <div className="w-full rounded border border-slate-800 bg-slate-950 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-100">Schedule</h2>

        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            Conflict
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-sky-400" />
            Highlighted
          </span>
        </div>
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-800">
            <th className="py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              Staff
            </th>
            <th className="py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              Clients
            </th>
            {showTimes && (
              <th className="py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                Start
              </th>
            )}
            {showTimes && (
              <th className="py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                End
              </th>
            )}
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => {
            const isHighlighted = highlightedAppointmentId === row.id;
            const isConflict = conflictIds.has(row.id);

            return (
              <tr
                key={row.id}
                className="cursor-pointer border-b border-slate-900"
                onMouseEnter={() => setHighlightedAppointment(row.id)}
                onMouseLeave={() => setHighlightedAppointment(null)}
                style={{
                  backgroundColor: isHighlighted
                    ? "rgba(56,189,248,0.12)"
                    : "transparent",
                  transition: "background-color 120ms ease",
                }}
              >
                <td className="py-2 align-top">
                  {row.staff.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {row.staff.map((s) => (
                        <span
                          key={s.id}
                          className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 text-[11px] text-slate-100"
                        >
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: hashColor(s.id) }}
                          />
                          {s.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-500">—</span>
                  )}
                </td>

                <td className="py-2 align-top">
                  {row.clients.length > 0 ? (
                    row.clients.map((c) => c.name).join(", ")
                  ) : (
                    <span className="text-slate-500">—</span>
                  )}
                </td>

                {showTimes && (
                  <td className="py-2 align-top text-slate-200">
                    {row.start_time
                      ? new Date(row.start_time).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </td>
                )}

                {showTimes && (
                  <td className="py-2 align-top">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-200">
                        {row.end_time
                          ? new Date(row.end_time).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </span>

                      {isConflict && (
                        <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                          Conflict
                        </span>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
