"use client";

import { Appointment, useAppointmentStore } from "@/store/appointmentStore";

interface AppointmentListProps {
  onEdit: (appointment: Appointment) => void;
}

export default function AppointmentList({ onEdit }: AppointmentListProps) {
  const { appointments, deleteAppointment } = useAppointmentStore();

  const activeAppointments = appointments.filter((a) => !a.archived);

  if (activeAppointments.length === 0) {
    return <p className="text-sm text-slate-500 py-2">No appointments added yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
            <th className="pb-2 pr-4">Name</th>
            <th className="pb-2 pr-4">Address</th>
            <th className="pb-2 pr-4 text-center">Mins</th>
            <th className="pb-2 pr-4 text-center">Staff</th>
            <th className="pb-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {activeAppointments.map((a) => (
            <tr key={a.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 align-top">
              <td className="py-2 pr-4">
                <span className="font-medium text-slate-100">{a.name}</span>
                {a.strictStartTime && (
                  <span className="ml-1 text-xs text-blue-400">@ {a.strictStartTime}</span>
                )}
              </td>
              <td className="py-2 pr-4 text-slate-200 text-xs">
                {[a.houseNumberOrName, a.address, a.postcode].filter(Boolean).join(", ")}
              </td>
              <td className="py-2 pr-4 text-center text-slate-100">{a.durationMinutes}</td>
              <td className="py-2 pr-4 text-center text-slate-100">{a.requiredStaff}</td>
              <td className="py-2 text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => onEdit(a)}
                    className="rounded border border-slate-500 px-2 py-0.5 text-xs text-slate-200 hover:bg-slate-700"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteAppointment(a.id)}
                    className="rounded border border-red-500 px-2 py-0.5 text-xs text-red-300 hover:bg-red-950"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
