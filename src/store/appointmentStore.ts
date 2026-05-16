// src/store/appointmentStore.ts

import { create } from "zustand";

export interface Appointment {
  id: string;

  name: string;
  houseNumberOrName?: string;
  address: string;
  postcode: string;

  strictStartTime?: string | null;
  durationMinutes: number;

  requiredStaff: number;

  purposeId?: string | null;
  visitsRequired: number;
  minGapMinutes: number;

  notes: string;

  staffGender: string | null;
  requiredSkills: string[];

  requiredWindows: string[];   // ⭐ NEW FIELD

  archived: boolean;
}

interface AppointmentState {
  appointments: Appointment[];
  setAppointments: (appointments: Appointment[]) => void;
  addAppointment: (data: Omit<Appointment, "id" | "archived">) => Appointment;
  updateAppointment: (id: string, updates: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;
  duplicateAppointment: (id: string) => void;
  archiveAppointment: (id: string) => void;
}

const STORAGE_KEY = "georoute_appointments";

function loadInitialAppointments(): Appointment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Appointment[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistAppointments(appointments: Appointment[]) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
  } catch {}
}

export const useAppointmentStore = create<AppointmentState>((set, get) => ({
  appointments: [],

  setAppointments: (appointments) => {
    persistAppointments(appointments);
    set({ appointments });
  },

  addAppointment: (data) => {
    const appointment: Appointment = {
      id: crypto.randomUUID(),
      archived: false,

      // defaults
      staffGender: data.staffGender ?? null,
      requiredSkills: data.requiredSkills ?? [],
      requiredWindows: data.requiredWindows ?? [],   // ⭐ NEW DEFAULT

      ...data,
    };

    const appointments = [...get().appointments, appointment];
    persistAppointments(appointments);
    set({ appointments });
    return appointment;
  },

  updateAppointment: (id, updates) => {
    const appointments = get().appointments.map((a) =>
      a.id === id
        ? {
            ...a,
            ...updates,
            requiredSkills: updates.requiredSkills ?? a.requiredSkills,
            requiredWindows: updates.requiredWindows ?? a.requiredWindows, // ⭐ NEW
          }
        : a
    );
    persistAppointments(appointments);
    set({ appointments });
  },

  deleteAppointment: (id) => {
    const appointments = get().appointments.filter((a) => a.id !== id);
    persistAppointments(appointments);
    set({ appointments });
  },

  duplicateAppointment: (id) => {
    const original = get().appointments.find((a) => a.id === id);
    if (!original) return;

    const copy: Appointment = {
      ...original,
      id: crypto.randomUUID(),
      name: `${original.name} (copy)`,
      archived: false,
      requiredSkills: [...original.requiredSkills],
      requiredWindows: [...original.requiredWindows], // ⭐ NEW
    };

    const appointments = [...get().appointments, copy];
    persistAppointments(appointments);
    set({ appointments });
  },

  archiveAppointment: (id) => {
    const appointments = get().appointments.map((a) =>
      a.id === id ? { ...a, archived: true } : a
    );
    persistAppointments(appointments);
    set({ appointments });
  },
}));

if (typeof window !== "undefined") {
  const initial = loadInitialAppointments();
  if (initial.length) {
    useAppointmentStore.getState().setAppointments(initial);
  }
}
