"use client";

import { Appointment, useAppointmentStore } from "@/store/appointmentStore";

interface AppointmentListProps {
  isFree: boolean;
  onEdit: (appointment: Appointment) => void;
}

export default function AppointmentList({ isFree, onEdit }: AppointmentListProps) {
  const {
    appointments,
    deleteAppointment,
    duplicateAppointment,
    archiveAppointment,
  } = useAppointmentStore();

  const activeAppointments = appointments.filter((a) => !a.archived);

  return (
    <div className="space-y-2 text-sm">
      {activeAppointments.length === 0 && (
        <p className="text-sm text-slate-500">No appointments added yet.</p>
      )}

      <ul className="space-y-2">
        {activeAppointments.map((a) => (
          <li
            key={a.id}
            className="flex items-center justify-between rounded border border-slate-700 bg-slate-900 px-3 py-2"
          >
            <div className="flex flex-col">
              <span className="font-medium text-slate-100">{a.name}</span>

              <span className="text-xs text-slate-400">
                {a.houseNumberOrName && `${a.houseNumberOrName}, `}
                {a.address} {a.postcode && `(${a.postcode})`}
              </span>

              <span className="text-xs text-slate-500">
                {a.durationMinutes} mins · staff: {a.requiredStaff} · visits/day:{" "}
                {a.visitsRequired}
              </span>

              {a.strictStartTime && (
                <span className="text-xs text-blue-400">
                  Strict time: {a.strictStartTime}
                </span>
              )}

              {a.minGapMinutes > 0 && (
                <span className="text-xs text-slate-500">
                  Min gap: {a.minGapMinutes} mins
                </span>
              )}

              {/* ⭐ NEW: Required Windows */}
              {a.requiredWindows && a.requiredWindows.length > 0 && (
                <span className="text-xs text-emerald-400">
                  Windows: {a.requiredWindows.join(", ")}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <button
                type="button"
                onClick={() => onEdit(a)}
                className="rounded border border-slate-600 px-2 py-0.5 hover:bg-slate-800"
              >
                Edit
              </button>

              <button
                type="button"
                onClick={() => duplicateAppointment(a.id)}
                className="rounded border border-slate-600 px-2 py-0.5 hover:bg-slate-800"
              >
                Duplicate
              </button>

              <button
                type="button"
                onClick={() => deleteAppointment(a.id)}
                className="rounded border border-red-600 px-2 py-0.5 text-red-400 hover:bg-red-950"
              >
                Delete
              </button>

              {!isFree && (
                <button
                  type="button"
                  onClick={() => archiveAppointment(a.id)}
                  className="rounded border border-yellow-600 px-2 py-0.5 text-yellow-400 hover:bg-yellow-950"
                >
                  Archive
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
