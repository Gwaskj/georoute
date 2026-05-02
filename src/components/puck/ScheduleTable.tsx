"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type ScheduleTableProps = {
  showTimes?: boolean;
  [key: string]: any; // allow Puck-injected props
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

export default function ScheduleTable({ showTimes = true }: ScheduleTableProps) {
  const supabase = createSupabaseBrowserClient();
  const [rows, setRows] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);

      const { data } = await supabase
        .from("appointments")
        .select(`
          id,
          start_time,
          end_time,
          staff:staff_id (
            id,
            name
          ),
          clients:client_id (
            id,
            name
          )
        `)
        .order("start_time", { ascending: true });

      const normalized = (data ?? []).map((row: any) => ({
        ...row,
        staff: Array.isArray(row.staff)
          ? row.staff
          : row.staff
          ? [row.staff]
          : [],
        clients: Array.isArray(row.clients)
          ? row.clients
          : row.clients
          ? [row.clients]
          : [],
      }));

      setRows(normalized);
      setLoading(false);
    }

    load();
  }, [supabase]);

  if (loading) {
    return (
      <div className="w-full rounded border bg-white p-4">
        <p className="text-sm text-gray-500">Loading schedule…</p>
      </div>
    );
  }

  return (
    <div className="w-full rounded border bg-white p-4">
      <h2 className="text-lg font-semibold mb-4">Schedule</h2>

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2">Staff</th>
            <th className="text-left py-2">Clients</th>
            {showTimes && <th className="text-left py-2">Start</th>}
            {showTimes && <th className="text-left py-2">End</th>}
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b">
              <td className="py-2">
                {row.staff.length > 0
                  ? row.staff.map((s) => s.name).join(", ")
                  : "—"}
              </td>

              <td className="py-2">
                {row.clients.length > 0
                  ? row.clients.map((c) => c.name).join(", ")
                  : "—"}
              </td>

              {showTimes && (
                <td className="py-2">
                  {row.start_time
                    ? new Date(row.start_time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </td>
              )}

              {showTimes && (
                <td className="py-2">
                  {row.end_time
                    ? new Date(row.end_time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
