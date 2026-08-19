// src/store/appointmentStore.ts
import { create } from "zustand";
import {
  loadFreeSchedulerData,
  updateSchedulerData,
} from "@/lib/freeSession";
import { supabase } from "@/lib/supabase/client";
import { logActivity } from "@/lib/logsClient";
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
  await updateSchedulerData((d) => ({ ...d, appointments }));
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

  // Write first, prune second -- see the same change in staffStore. Deleting
  // before inserting means any failure in between loses the entire list, and
  // adding columns to the insert (as the recurrence work does) is exactly when
  // that failure becomes likely.
  const rows = appointments.map((a) => ({
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
      staff_gender: a.staffGender ?? null,
      required_skills: a.requiredSkills,
      required_windows: a.requiredWindows,
      starts_on: a.startsOn ?? null,
      ends_on: a.endsOn ?? null,
      recur_freq: a.recurFreq ?? "once",
      recur_interval: a.recurInterval ?? 1,
      recur_weekdays: a.recurWeekdays ?? [],
      archived: a.archived,
  }));

  if (rows.length > 0) {
    const { error: upsertError } = await supabase
      .from("appointments")
      .upsert(rows, { onConflict: "user_id,local_id" });

    if (upsertError) {
      console.error("Failed to save pro appointments:", upsertError);
      return;
    }
  }

  // Remove rows for appointments since deleted, by primary key rather than a
  // filter expression so an encoding slip cannot widen the delete.
  const { data: existing, error: readError } = await supabase
    .from("appointments")
    .select("id, local_id")
    .eq("user_id", user.id);

  if (readError) {
    console.error("Failed to read back pro appointments:", readError);
    return;
  }

  const keep = new Set(appointments.map((a) => a.id));
  const stale = (existing ?? [])
    .filter((row: { local_id: string | null }) => !row.local_id || !keep.has(row.local_id))
    .map((row: { id: number }) => row.id);

  if (stale.length > 0) {
    const { error: delError } = await supabase.from("appointments").delete().in("id", stale);
    if (delError) console.error("Failed to prune removed pro appointments:", delError);
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
      staffGender: row.staff_gender ?? null,
      requiredSkills: row.required_skills ?? [],
      requiredWindows: row.required_windows ?? [],
      startsOn: row.starts_on ?? null,
      endsOn: row.ends_on ?? null,
      recurFreq: (row.recur_freq ?? "once") as RecurFreq,
      recurInterval: row.recur_interval ?? 1,
      recurWeekdays: row.recur_weekdays ?? [],
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
