// src/store/appointmentStore.ts
import { create } from "zustand";
import { loadFreeSchedulerData, updateSchedulerData } from "@/lib/freeSession";
import type { RecurFreq } from "@/lib/recurrence/occurrences";

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


  staffGender: string | null;
  requiredSkills: string[];

  requiredWindows: string[];

  /** First date this visit is due, "YYYY-MM-DD". */
  startsOn?: string | null;
  /** Last date, or null for open ended. */
  endsOn?: string | null;
  recurFreq: RecurFreq;
  /** Every N days or weeks. */
  recurInterval: number;
  /** ISO weekdays, 1 = Monday .. 7 = Sunday. Weekly only. */
  recurWeekdays: number[];

  archived: boolean;
}

interface AppointmentState {
  appointments: Appointment[];
  setAppointments: (appointments: Appointment[]) => void;
  addAppointment: (data: Omit<Appointment, "id" | "archived">) => Appointment;
  updateAppointment: (id: string, updates: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;
  clearAllAppointments: () => void;
  duplicateAppointment: (id: string) => void;
  archiveAppointment: (id: string) => void;
}

/**
 * Saves used to be debounced on the way to Supabase, because each one was a
 * delete-then-insert of the whole list and overlapping calls raced. Writing
 * locally is a single atomic update, so both the timer and the race it was
 * covering for have gone.
 */
async function persist(appointments: Appointment[]) {
  await updateSchedulerData((d) => ({ ...d, appointments }));
}

export const useAppointmentStore = create<AppointmentState>((set, get) => ({
  appointments: [],

  setAppointments: (appointments) => {
    persist(appointments);
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
    persist(appointments);
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

    persist(appointments);
    set({ appointments });
  },

  deleteAppointment: (id) => {
    const appointments = get().appointments.filter((a) => a.id !== id);
    persist(appointments);
    set({ appointments });
  },

  clearAllAppointments: () => {
    persist([]);
    set({ appointments: [] });
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
    persist(appointments);
    set({ appointments });
  },

  archiveAppointment: (id) => {
    const appointments = get().appointments.map((a) =>
      a.id === id ? { ...a, archived: true } : a
    );

    persist(appointments);
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
