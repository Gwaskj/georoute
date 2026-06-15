"use client";

import { Appointment, useAppointmentStore } from "@/store/appointmentStore";
import { useCustomWindowStore } from "@/store/customWindowStore";

interface AppointmentListProps {
  onEdit: (appointment: Appointment) => void;
}

export default function AppointmentList({ onEdit }: AppointmentListProps) {
  const { appointments, deleteAppointment } = useAppointmentStore();
  const { windows } = useCustomWindowStore();

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
            <th className="pb-2 pr-4 text-center">Calls/day</th>
            <th className="pb-2 pr-4 text-center">Required Staff</th>
            <th className="pb-2 pr-4">Windows</th>
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
              <td className="py-2 pr-4 text-center text-slate-100">{a.visitsRequired}</td>
              <td className="py-2 pr-4 text-center text-slate-100">{a.requiredStaff}</td>
              <td className="py-2 pr-4">
                {a.requiredWindows && a.requiredWindows.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {a.requiredWindows.map((wid) => {
                      const w = windows.find((x) => x.id === wid);
                      return w ? (
                        <span key={wid} className="rounded bg-emerald-900/60 px-1.5 py-0.5 text-xs text-emerald-300">
                          {w.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                ) : (
                  <span className="text-xs text-slate-500">Any time</span>
                )}
              </td>
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
