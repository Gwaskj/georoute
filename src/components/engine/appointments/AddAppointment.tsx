"use client";

import { useState } from "react";
import {
  Appointment,
  Appointment as AppointmentType,
  useAppointmentStore,
} from "@/store/appointmentStore";
import {
  useCallPurposeStore,
  CallPurpose,
} from "@/store/callPurposeStore";
import AppointmentList from "./AppointmentList";

interface AddAppointmentProps {
  isFree: boolean;
}

interface AppointmentFormState {
  id?: string;
  name: string;
  houseNumberOrName: string;
  address: string;
  postcode: string;

  strictStartTime: string;
  durationMinutes: string;

  requiredStaff: string;
  purposeId: string;
  visitsRequired: string;
  minGapMinutes: string;

  notes: string;
}

const emptyForm: AppointmentFormState = {
  name: "",
  houseNumberOrName: "",
  address: "",
  postcode: "",
  strictStartTime: "",
  durationMinutes: "30",
  requiredStaff: "1",
  purposeId: "",
  visitsRequired: "1",
  minGapMinutes: "120",
  notes: "",
};

export default function AddAppointment({ isFree }: AddAppointmentProps) {
  const {
    addAppointment,
    updateAppointment,
  } = useAppointmentStore();
  const { purposes } = useCallPurposeStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<AppointmentFormState>(emptyForm);

  const openAddModal = () => {
    setIsEditing(false);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (a: AppointmentType) => {
    setIsEditing(true);
    setForm({
      id: a.id,
      name: a.name,
      houseNumberOrName: a.houseNumberOrName ?? "",
      address: a.address,
      postcode: a.postcode,
      strictStartTime: a.strictStartTime ?? "",
      durationMinutes: String(a.durationMinutes),
      requiredStaff: String(a.requiredStaff),
      purposeId: a.purposeId ?? "",
      visitsRequired: String(a.visitsRequired),
      minGapMinutes: String(a.minGapMinutes),
      notes: a.notes,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return;

    const duration = parseInt(form.durationMinutes || "0", 10) || 0;
    const requiredStaff = Math.max(
      1,
      Math.min(5, parseInt(form.requiredStaff || "1", 10) || 1)
    );
    const visitsRequired = Math.max(
      1,
      Math.min(10, parseInt(form.visitsRequired || "1", 10) || 1)
    );
    const minGapMinutes = Math.max(
      0,
      parseInt(form.minGapMinutes || "120", 10) || 120
    );

    const payload: Omit<Appointment, "id" | "archived"> = {
      name: form.name.trim(),
      houseNumberOrName: form.houseNumberOrName.trim() || undefined,
      address: form.address.trim(),
      postcode: form.postcode.trim(),
      strictStartTime: form.strictStartTime ? form.strictStartTime : null,
      durationMinutes: duration,
      requiredStaff,
      purposeId: form.purposeId || null,
      visitsRequired,
      minGapMinutes,
      notes: form.notes.trim(),
    };

    if (isEditing && form.id) {
      updateAppointment(form.id, payload);
    } else {
      addAppointment(payload);
    }

    setIsModalOpen(false);
    setForm(emptyForm);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">Appointments / Clients</h2>
        <button
          type="button"
          onClick={openAddModal}
          className="rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Add appointment
        </button>
      </div>

      <AppointmentList isFree={isFree} onEdit={openEditModal} />

      {isModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded bg-white p-4 shadow-lg">
            <h3 className="mb-3 text-base font-semibold">
              {isEditing ? "Edit appointment" : "Add appointment"}
            </h3>

            <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block font-medium">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="w-full rounded border border-gray-300 px-2 py-1"
                />
              </div>

              <div>
                <label className="mb-1 block font-medium">
                  House number / name (optional)
                </label>
                <input
                  type="text"
                  value={form.houseNumberOrName}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      houseNumberOrName: e.target.value,
                    }))
                  }
                  className="w-full rounded border border-gray-300 px-2 py-1"
                />
              </div>

              <div>
                <label className="mb-1 block font-medium">Address</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, address: e.target.value }))
                  }
                  className="w-full rounded border border-gray-300 px-2 py-1"
                />
              </div>

              <div>
                <label className="mb-1 block font-medium">Postcode</label>
                <input
                  type="text"
                  value={form.postcode}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, postcode: e.target.value }))
                  }
                  className="w-full rounded border border-gray-300 px-2 py-1"
                />
              </div>

              <div>
                <label className="mb-1 block font-medium">
                  Strict time (optional)
                </label>
                <input
                  type="time"
                  value={form.strictStartTime}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      strictStartTime: e.target.value,
                    }))
                  }
                  className="w-full rounded border border-gray-300 px-2 py-1"
                />
              </div>

              <div>
                <label className="mb-1 block font-medium">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.durationMinutes}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      durationMinutes: e.target.value,
                    }))
                  }
                  className="w-full rounded border border-gray-300 px-2 py-1"
                />
              </div>

              <div>
                <label className="mb-1 block font-medium">
                  Required staff (1–5)
                </label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={form.requiredStaff}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      requiredStaff: e.target.value,
                    }))
                  }
                  className="w-full rounded border border-gray-300 px-2 py-1"
                />
              </div>

              <div>
                <label className="mb-1 block font-medium">
                  Purpose of call (optional)
                </label>
                <select
                  value={form.purposeId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, purposeId: e.target.value }))
                  }
                  className="w-full rounded border border-gray-300 px-2 py-1"
                >
                  <option value="">None</option>
                  {purposes.map((p: CallPurpose) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.start}–{p.end})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block font-medium">
                  Visits required per day
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={form.visitsRequired}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      visitsRequired: e.target.value,
                    }))
                  }
                  className="w-full rounded border border-gray-300 px-2 py-1"
                />
              </div>

              <div>
                <label className="mb-1 block font-medium">
                  Min gap between calls (minutes)
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.minGapMinutes}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      minGapMinutes: e.target.value,
                    }))
                  }
                  className="w-full rounded border border-gray-300 px-2 py-1"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block font-medium">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  className="w-full rounded border border-gray-300 px-2 py-1"
                  rows={3}
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
              >
                {isEditing ? "Save" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
