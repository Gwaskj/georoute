"use client";

import { useState, useMemo } from "react";

import {
  Appointment,
  Appointment as AppointmentType,
  useAppointmentStore,
} from "@/store/appointmentStore";

import { useSkillsStore, Skill } from "@/store/skillsStore";
import { useCustomWindowStore } from "@/store/customWindowStore";   // ⭐ FIXED
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
  visitsRequired: string;
  minGapMinutes: string;

  notes: string;

  staffGender: string;
  requiredSkills: string[];

  requiredWindows: string[];   // ⭐ NEW
}

const emptyForm: AppointmentFormState = {
  name: "",
  houseNumberOrName: "",
  address: "",
  postcode: "",
  strictStartTime: "",
  durationMinutes: "30",
  requiredStaff: "1",
  visitsRequired: "1",
  minGapMinutes: "120",
  notes: "",

  staffGender: "",
  requiredSkills: [],

  requiredWindows: [],   // ⭐ NEW
};

export default function AddAppointment({ isFree }: AddAppointmentProps) {
  const { appointments, addAppointment, updateAppointment } = useAppointmentStore();
  const { skills } = useSkillsStore();

  const canAddMore = useMemo(() => {
    if (!isFree) return true;
    return appointments.filter((a) => !a.archived).length < 10;
  }, [isFree, appointments]);
  const { windows } = useCustomWindowStore();   // ⭐ FIXED

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
      visitsRequired: String(a.visitsRequired),
      minGapMinutes: String(a.minGapMinutes),
      notes: a.notes,

      staffGender: a.staffGender ?? "",
      requiredSkills: a.requiredSkills ?? [],

      requiredWindows: a.requiredWindows ?? [],   // ⭐ NEW
    });
    setIsModalOpen(true);
  };

  const toggleSkill = (id: string) => {
    setForm((prev) => {
      const exists = prev.requiredSkills.includes(id);
      return {
        ...prev,
        requiredSkills: exists
          ? prev.requiredSkills.filter((x) => x !== id)
          : [...prev.requiredSkills, id],
      };
    });
  };

  const toggleWindow = (id: string) => {
    setForm((prev) => {
      const exists = prev.requiredWindows.includes(id);
      const maxWindows = Math.max(1, parseInt(prev.visitsRequired || "1", 10) || 1);
      if (!exists && prev.requiredWindows.length >= maxWindows) return prev;
      return {
        ...prev,
        requiredWindows: exists
          ? prev.requiredWindows.filter((x) => x !== id)
          : [...prev.requiredWindows, id],
      };
    });
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
      visitsRequired,
      minGapMinutes,
      notes: form.notes.trim(),

      staffGender: form.staffGender || null,
      requiredSkills: form.requiredSkills,

      requiredWindows: form.requiredWindows,   // ⭐ NEW
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
        <h2 className="text-lg font-semibold text-slate-200">
          Appointments / Clients
        </h2>
        <div className="flex flex-col items-end gap-1">
          <button
            type="button"
            onClick={openAddModal}
            disabled={!canAddMore}
            className="rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Add appointment
          </button>
          {!canAddMore && (
            <p className="text-xs text-amber-400">
              Free limit reached (10). Upgrade to Pro for unlimited appointments.
            </p>
          )}
        </div>
      </div>

      <AppointmentList onEdit={openEditModal} />

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header flex justify-between items-center">
              <h3 className="text-base font-semibold text-slate-100">
                {isEditing ? "Edit appointment" : "Add appointment"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-xl"
              >
                ×
              </button>
            </div>

            <div className="modal-body text-sm text-slate-200 space-y-6">
              {/* BASIC FIELDS */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-1 block font-medium">Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    className="w-full rounded bg-slate-900 border border-slate-700 px-2 py-1"
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
                    className="w-full rounded bg-slate-900 border border-slate-700 px-2 py-1"
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
                    className="w-full rounded bg-slate-900 border border-slate-700 px-2 py-1"
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
                    className="w-full rounded bg-slate-900 border border-slate-700 px-2 py-1"
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
                    className="w-full rounded bg-slate-900 border border-slate-700 px-2 py-1"
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
                    className="w-full rounded bg-slate-900 border border-slate-700 px-2 py-1"
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
                    className="w-full rounded bg-slate-900 border border-slate-700 px-2 py-1"
                  />
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
                    className="w-full rounded bg-slate-900 border border-slate-700 px-2 py-1"
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
                    className="w-full rounded bg-slate-900 border border-slate-700 px-2 py-1"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block font-medium">Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, notes: e.target.value }))
                    }
                    className="w-full rounded bg-slate-900 border border-slate-700 px-2 py-1"
                    rows={3}
                  />
                </div>
              </div>

              {/* STAFF REQUIREMENTS */}
              <div className="rounded border border-slate-700 p-3">
                <h4 className="text-sm font-semibold mb-2">
                  Staff Requirements
                </h4>

                <label className="block text-xs mb-1">Gender preference</label>
                <select
                  value={form.staffGender}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, staffGender: e.target.value }))
                  }
                  className="w-full rounded bg-slate-900 border border-slate-700 px-2 py-1 mb-3"
                >
                  <option value="">No preference</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>

                <label className="block text-xs mb-1">Required skills</label>
                <div className="flex flex-wrap gap-2 mb-4">
                  {skills.map((skill: Skill) => {
                    const active = form.requiredSkills.includes(skill.id);
                    return (
                      <button
                        key={skill.id}
                        type="button"
                        onClick={() => toggleSkill(skill.id)}
                        className={`rounded border px-2 py-0.5 text-xs ${
                          active
                            ? "border-blue-500 bg-blue-900 text-blue-300"
                            : "border-slate-600 text-slate-300 hover:bg-slate-800"
                        }`}
                      >
                        {skill.name}
                      </button>
                    );
                  })}
                </div>

                {/* REQUIRED WINDOWS */}
                {windows.length > 0 && (() => {
                  const maxWindows = Math.max(1, parseInt(form.visitsRequired || "1", 10) || 1);
                  const selectedCount = form.requiredWindows.length;
                  const remaining = maxWindows - selectedCount;
                  const mismatch = selectedCount > 0 && selectedCount !== maxWindows;

                  return (
                    <>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs">Required windows</label>
                        <span className="text-xs text-slate-400">
                          {selectedCount}/{maxWindows} selected
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-2">
                        {windows.map((w) => {
                          const active = form.requiredWindows.includes(w.id);
                          const atMax = !active && selectedCount >= maxWindows;
                          return (
                            <button
                              key={w.id}
                              type="button"
                              onClick={() => toggleWindow(w.id)}
                              disabled={atMax}
                              className={`rounded border px-2 py-0.5 text-xs transition-colors ${
                                active
                                  ? "border-emerald-500 bg-emerald-900 text-emerald-300"
                                  : atMax
                                  ? "border-slate-700 text-slate-600 cursor-not-allowed"
                                  : "border-slate-600 text-slate-300 hover:bg-slate-800"
                              }`}
                            >
                              {w.name} ({w.start}–{w.end})
                            </button>
                          );
                        })}
                      </div>

                      {mismatch && (
                        <div className="mb-2 rounded border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                          <span className="font-semibold">⚠ Window mismatch</span>
                          {" — "}
                          {selectedCount < maxWindows
                            ? `${selectedCount} window${selectedCount !== 1 ? "s" : ""} selected for ${maxWindows} visit${maxWindows !== 1 ? "s" : ""}. The remaining ${remaining} visit${remaining !== 1 ? "s" : ""} will be scheduled at any available time.`
                            : `${selectedCount} window${selectedCount !== 1 ? "s" : ""} selected but only ${maxWindows} visit${maxWindows !== 1 ? "s" : ""} required.`}
                        </div>
                      )}
                    </>
                  );
                })()}

                {windows.length === 0 && (
                  <p className="text-xs text-slate-500 mb-2">
                    No time windows set. Add them in Settings to restrict when visits can be scheduled.
                  </p>
                )}

                <p className="text-xs text-slate-500">
                  If strict time is set, it overrides required windows.
                </p>
              </div>
            </div>

            <div className="modal-footer flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded border border-slate-600 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800"
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
