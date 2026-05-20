// src/store/appointmentStore.ts
import { create } from "zustand";
import {
  loadFreeSchedulerData,
  saveFreeSchedulerData,
} from "@/lib/freeSession";

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

  requiredWindows: string[];

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

async function persistFree(appointments: Appointment[]) {
  const data = (await loadFreeSchedulerData()) ?? {};
  await saveFreeSchedulerData({ ...data, appointments });
}

export const useAppointmentStore = create<AppointmentState>((set, get) => ({
  appointments: [],

  setAppointments: (appointments) => {
    persistFree(appointments);
    set({ appointments });
  },

  addAppointment: (data) => {
    const appointment: Appointment = {
      id: crypto.randomUUID(),
      archived: false,

      staffGender: data.staffGender ?? null,
      requiredSkills: data.requiredSkills ?? [],
      requiredWindows: data.requiredWindows ?? [],

      ...data,
    };

    const appointments = [...get().appointments, appointment];
    persistFree(appointments);
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
            requiredWindows: updates.requiredWindows ?? a.requiredWindows,
          }
        : a
    );

    persistFree(appointments);
    set({ appointments });
  },

  deleteAppointment: (id) => {
    const appointments = get().appointments.filter((a) => a.id !== id);
    persistFree(appointments);
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
      requiredWindows: [...original.requiredWindows],
    };

    const appointments = [...get().appointments, copy];
    persistFree(appointments);
    set({ appointments });
  },

  archiveAppointment: (id) => {
    const appointments = get().appointments.map((a) =>
      a.id === id ? { ...a, archived: true } : a
    );

    persistFree(appointments);
    set({ appointments });
  },
}));

// INITIAL LOAD
if (typeof window !== "undefined") {
  loadFreeSchedulerData().then((data) => {
    if (data?.appointments?.length) {
      useAppointmentStore.getState().setAppointments(data.appointments);
    }
  });
}
