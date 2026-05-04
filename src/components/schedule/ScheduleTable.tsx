"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useHighlightStore } from "@/lib/map/highlightStore";

type Appointment = {
  id: string;
  staff_id: string | null;
  customer_name: string;
  start_time: string;
  end_time: string;
  lat: number | null;
  lng: number | null;
};

export default function ScheduleTable() {
  const supabase = createClient();

  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const highlightedAppointmentId = useHighlightStore(
    (s) => s.highlightedAppointmentId
  );
  const setHighlightedAppointment = useHighlightStore(
    (s) => s.setHighlightedAppointment
  );

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("appointments").select("*");
      setAppointments(data ?? []);
    }

    load();

    const channel = supabase
      .channel("schedule-table")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments" },
        () => load()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return (
    <div className="w-full border rounded-md overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">Customer</th>
            <th className="p-2 text-left">Staff</th>
            <th className="p-2 text-left">Start</th>
            <th className="p-2 text-left">End</th>
          </tr>
        </thead>

        <tbody>
          {appointments.map((a) => (
            <tr
              key={a.id}
              onClick={() => setHighlightedAppointment(a.id)}
              className={`cursor-pointer transition-colors ${
                highlightedAppointmentId === a.id
                  ? "bg-blue-100"
                  : "hover:bg-gray-50"
              }`}
            >
              <td className="p-2">{a.customer_name}</td>
              <td className="p-2">{a.staff_id ?? "Unassigned"}</td>
              <td className="p-2">{a.start_time}</td>
              <td className="p-2">{a.end_time}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
