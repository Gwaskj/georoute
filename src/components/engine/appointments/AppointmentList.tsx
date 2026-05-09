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

  const activeAppointments = appointments.filter((a: Appointment) => !a.archived);

  return (
    <div className="space-y-2 text-sm">
      {activeAppointments.length === 0 && (
        <p className="text-sm text-gray-500">No appointments added yet.</p>
      )}

      <ul className="space-y-2">
        {activeAppointments.map((a: Appointment) => (
          <li
            key={a.id}
            className="flex items-center justify-between rounded border border-gray-200 px-3 py-2"
          >
            <div className="flex flex-col">
              <span className="font-medium">{a.name}</span>
              <span className="text-xs text-gray-500">
                {a.houseNumberOrName && `${a.houseNumberOrName}, `}
                {a.address} {a.postcode && `(${a.postcode})`}
              </span>
              <span className="text-xs text-gray-500">
                {a.durationMinutes} mins · staff: {a.requiredStaff} · visits/day:{" "}
                {a.visitsRequired}
              </span>
              {a.strictStartTime && (
                <span className="text-xs text-blue-600">
                  Strict time: {a.strictStartTime}
                </span>
              )}
              {a.minGapMinutes > 0 && (
                <span className="text-xs text-gray-500">
                  Min gap between calls: {a.minGapMinutes} mins
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500">
              <button
                type="button"
                onClick={() => onEdit(a)}
                className="rounded border border-gray-300 px-2 py-0.5 hover:bg-gray-50"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => duplicateAppointment(a.id)}
                className="rounded border border-gray-300 px-2 py-0.5 hover:bg-gray-50"
              >
                Duplicate
              </button>
              <button
                type="button"
                onClick={() => deleteAppointment(a.id)}
                className="rounded border border-red-300 px-2 py-0.5 text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
              {!isFree && (
                <button
                  type="button"
                  onClick={() => archiveAppointment(a.id)}
                  className="rounded border border-yellow-300 px-2 py-0.5 text-yellow-700 hover:bg-yellow-50"
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
