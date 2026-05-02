"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type ScheduleTableProps = {
  showTimes: boolean;
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
  staff: StaffMember[];   // ✅ FIXED: now supports multiple staff
  clients: Client[];      // already correct for multi-client
};

export default function ScheduleTable({ showTimes }: ScheduleTableProps) {
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

      // Ensure arrays (Supabase returns null if no join rows)
      const normalized = (data ?? []).map((row: unknown) => {
        const record = typeof row === 'object' && row !== null
          ? (row as { staff?: unknown; clients?: unknown; [key: string]: unknown })
          : {};
        return {
          ...record,
          staff: Array.isArray(record.staff) ? record.staff : record.staff != null ? [record.staff] : [],
          clients: Array.isArray(record.clients) ? record.clients : record.clients != null ? [record.clients] : [],
        };
      });
      setLoading(false);
    }

    load();
  }, []);

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
