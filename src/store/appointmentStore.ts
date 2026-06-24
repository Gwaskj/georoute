// src/store/appointmentStore.ts
import { create } from "zustand";
import {
  loadFreeSchedulerData,
  saveFreeSchedulerData,
} from "@/lib/freeSession";
import { supabase } from "@/lib/supabase/client";
import { logActivity } from "@/lib/logsClient";

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
  clearAllAppointments: () => void;
  duplicateAppointment: (id: string) => void;
  archiveAppointment: (id: string) => void;
  loadFromSupabase: () => Promise<void>;
}

async function isPro(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("profiles")
    .select("is_pro")
    .eq("user_id", user.id)
    .maybeSingle();
  return data?.is_pro === true;
}

async function persistFree(appointments: Appointment[]) {
  const data = (await loadFreeSchedulerData()) ?? {
    staff: [],
    routes: [],
    appointments: [],
  };

  await saveFreeSchedulerData({
    staff: data.staff ?? [],
    routes: data.routes ?? [],
    appointments,
    windows: data.windows ?? [],
    skills: data.skills ?? [],
    officePostcode: data.officePostcode ?? "",
    selectedStaffIds: data.selectedStaffIds ?? [],
    visits: data.visits ?? [],
  });
}

// Debounce: collapses rapid successive saves into one Supabase call.
// Prevents the DELETE+INSERT race when multiple actions fire in quick succession.
let _syncTimer: ReturnType<typeof setTimeout> | null = null;
let _pendingSync: Appointment[] | null = null;

function scheduleSyncPro(appointments: Appointment[]) {
  _pendingSync = appointments;
  if (_syncTimer) return;
  _syncTimer = setTimeout(async () => {
    _syncTimer = null;
    const apps = _pendingSync!;
    _pendingSync = null;
    const pro = await isPro();
    if (pro) await persistPro(apps);
  }, 300);
}

async function persistPro(appointments: Appointment[]) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error: delError } = await supabase
    .from("appointments")
    .delete()
    .eq("user_id", user.id);

  if (delError) {
    console.error("Failed to clear pro appointments:", delError);
    return;
  }

  if (appointments.length === 0) return;

  const { error: insError } = await supabase.from("appointments").insert(
    appointments.map((a) => ({
      user_id: user.id,
      local_id: a.id,
      name: a.name,
      house_number_or_name: a.houseNumberOrName ?? null,
      address: a.address,
      postcode: a.postcode,
      strict_start_time: a.strictStartTime ?? null,
      duration_minutes: a.durationMinutes,
      required_staff: a.requiredStaff,
      purpose_id: a.purposeId ?? null,
      visits_required: a.visitsRequired,
      min_gap_minutes: a.minGapMinutes,
      notes: a.notes,
      staff_gender: a.staffGender ?? null,
      required_skills: a.requiredSkills,
      required_windows: a.requiredWindows,
      archived: a.archived,
    }))
  );

  if (insError) {
    console.error("Failed to insert pro appointments:", insError);
  }
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
    scheduleSyncPro(appointments);
    isPro().then((pro) => {
      if (pro) logActivity("appointment_created", null, { appointmentId: appointment.id, name: appointment.name });
    });
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
    scheduleSyncPro(appointments);
    isPro().then((pro) => {
      if (pro) logActivity("appointment_updated", null, { appointmentId: id, updates });
    });
    set({ appointments });
  },

  deleteAppointment: (id) => {
    const removed = get().appointments.find((a) => a.id === id);
    const appointments = get().appointments.filter((a) => a.id !== id);
    persistFree(appointments);
    scheduleSyncPro(appointments);
    isPro().then((pro) => {
      if (pro) logActivity("appointment_deleted", null, { appointmentId: id, name: removed?.name });
    });
    set({ appointments });
  },

  clearAllAppointments: () => {
    persistFree([]);
    scheduleSyncPro([]);
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
    persistFree(appointments);
    scheduleSyncPro(appointments);
    set({ appointments });
  },

  archiveAppointment: (id) => {
    const appointments = get().appointments.map((a) =>
      a.id === id ? { ...a, archived: true } : a
    );

    persistFree(appointments);
    scheduleSyncPro(appointments);
    set({ appointments });
  },

  loadFromSupabase: async () => {
    const pro = await isPro();
    if (!pro) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("appointments")
      .select("*")
      .eq("user_id", user.id);

    if (!data) return;

    const seen = new Set<string>();
    const mapped: Appointment[] = data
      .filter((row) => {
        const id = row.local_id;
        if (!id || seen.has(id)) return false;
        seen.add(id);
        return true;
      })
      .map((row) => ({
      id: row.local_id,
      name: row.name ?? "",
      houseNumberOrName: row.house_number_or_name ?? undefined,
      address: row.address ?? "",
      postcode: row.postcode ?? "",
      strictStartTime: row.strict_start_time ?? null,
      durationMinutes: row.duration_minutes ?? 30,
      requiredStaff: row.required_staff ?? 1,
      purposeId: row.purpose_id ?? null,
      visitsRequired: row.visits_required ?? 1,
      minGapMinutes: row.min_gap_minutes ?? 120,
      notes: row.notes ?? "",
      staffGender: row.staff_gender ?? null,
      requiredSkills: row.required_skills ?? [],
      requiredWindows: row.required_windows ?? [],
      archived: row.archived ?? false,
    }));

    set({ appointments: mapped });
  },
}));

// INITIAL LOAD
if (typeof window !== "undefined") {
  loadFreeSchedulerData().then(async (data) => {
    const store = useAppointmentStore.getState();

    const pro = await isPro();
    if (pro) {
      await store.loadFromSupabase();
      return;
    }

    if (data?.appointments?.length) {
      store.setAppointments(data.appointments);
    }
  });
}
