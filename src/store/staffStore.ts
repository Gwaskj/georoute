// src/store/staffStore.ts
import { create } from "zustand";
import { supabase } from "@/lib/supabase/client";
import {
  loadFreeSchedulerData,
  saveFreeSchedulerData,
  FreeSchedulerData,
} from "@/lib/freeSession";
import { logActivity } from "@/lib/logsClient";

export type Gender = "Male" | "Female" | "Other";

export type StartLocation = "home" | "office";

/**
 * An unpaid break within a staff member's day, such as lunch.
 *
 * The break floats: the scheduler places it wherever it fits rather than at a
 * fixed clock time, which is what lets a round absorb it without pushing every
 * later visit back. A window constrains where it may land; with no window it
 * can go anywhere in the person's working day.
 */
export interface StaffBreak {
  id: string;
  /** Length in minutes. */
  minutes: number;
  /** Optional earliest start, "HH:MM". Defaults to the start of their day. */
  windowStart?: string;
  /** Optional latest end, "HH:MM". Defaults to the end of their day. */
  windowEnd?: string;
}

/**
 * A staff row as the database spells it.
 *
 * Snake case and nullable throughout, which is precisely why it is worth
 * writing down: this is the only place the two naming conventions meet, and
 * every field below is one that could silently arrive as null.
 */
interface StaffRow {
  local_id: string;
  name: string | null;
  home_postcode: string | null;
  office_postcode: string | null;
  start_location: string | null;
  date_of_birth: string | null;
  // Narrower than the column, which is plain text. Only this app writes it,
  // and it only ever writes a Gender or an empty string -- typing it as bare
  // string instead pushes an unchecked cast onto every read.
  gender: Gender | "" | null;
  skills: string[] | null;
  colour: string | null;
  work_start: string | null;
  work_end: string | null;
  breaks: StaffBreak[] | null;
  auth_user_id: string | null;
}

export interface Staff {
  id: string;
  name: string;
  homePostcode: string;
  officePostcode: string;
  startLocation: StartLocation;
  dateOfBirth: string;
  gender: Gender | "";
  skills: string[];
  colour: string;
  workStart?: string;
  workEnd?: string;
  /** Unpaid breaks. Empty or omitted means none. */
  breaks?: StaffBreak[];
  /**
   * The auth user reading this staff member's rounds, if a login has been
   * created. Read-only here -- it is managed by /api/staff-accounts and is
   * deliberately not written back by persistPro.
   */
  authUserId?: string | null;
}

interface StaffState {
  staff: Staff[];
  selectedStaffIds: string[];
  setStaff: (staff: Staff[]) => void;
  addStaff: (staff: Omit<Staff, "id" | "colour">) => Staff;
  updateStaff: (id: string, updates: Partial<Staff>) => void;
  deleteStaff: (id: string) => void;
  clearAllStaff: () => void;
  setSelectedStaffIds: (ids: string[]) => void;
  /** Load staff from Supabase for pro users */
  loadFromSupabase: () => Promise<void>;
}

function generateColour(): string {
  const colours = [
    "#e6194b", "#3cb44b", "#ffe119", "#4363d8",
    "#f58231", "#911eb4", "#46f0f0", "#f032e6",
    "#bcf60c", "#fabebe", "#008080", "#e6beff",
    "#9a6324", "#fffac8", "#800000", "#aaffc3",
    "#808000", "#ffd8b1", "#000075", "#808080",
  ];
  return colours[Math.floor(Math.random() * colours.length)];
}

function cleanPostcode(p: string) {
  return p.trim().toUpperCase();
}

/** Check if current user is pro */
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

async function persistFree(staff: Staff[], selectedStaffIds: string[]) {
  const existing: FreeSchedulerData =
    (await loadFreeSchedulerData()) ?? {
      staff: [],
      appointments: [],
      routes: [],
      visits: [],
      officePostcode: null,
      selectedStaffIds: [],
    };

  await saveFreeSchedulerData({
    ...existing,
    staff,
    selectedStaffIds,
  });
}

async function persistPro(staff: Staff[], selectedStaffIds: string[]) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Write first, prune second.
  //
  // This used to delete every row for the user and then re-insert. Any failure
  // in between -- a missing column, a constraint, a dropped connection -- left
  // them with no staff at all. Upserting first means a failed save leaves the
  // previous list untouched; the worst case is a stale row surviving, which
  // the prune below fixes on the next successful save.
  const rows = staff.map((s) => ({
      user_id: user.id,
      name: s.name,
      home_postcode: s.homePostcode,
      office_postcode: s.officePostcode,
      date_of_birth: s.dateOfBirth,
      gender: s.gender,
      skills: s.skills,
      colour: s.colour,
      work_start: s.workStart ?? null,
      work_end: s.workEnd ?? null,
      breaks: s.breaks ?? [],
    start_location: s.startLocation,
    local_id: s.id,
  }));

  if (rows.length > 0) {
    const { error: upsertError } = await supabase
      .from("staff")
      .upsert(rows, { onConflict: "user_id,local_id" });

    if (upsertError) {
      console.error("Failed to save pro staff:", upsertError);
      // Bail out before pruning -- deleting against a failed write is exactly
      // how the old version lost data.
      return;
    }
  }

  // Remove rows for staff the user has since deleted. Done by primary key
  // rather than a filter expression so an encoding slip cannot widen the
  // delete beyond the rows we identified.
  const { data: existing, error: readError } = await supabase
    .from("staff")
    .select("id, local_id")
    .eq("user_id", user.id);

  if (readError) {
    console.error("Failed to read back pro staff:", readError);
    return;
  }

  const keep = new Set(staff.map((s) => s.id));
  const stale = (existing ?? [])
    .filter((row: { local_id: string | null }) => !row.local_id || !keep.has(row.local_id))
    .map((row: { id: number }) => row.id);

  if (stale.length > 0) {
    const { error: delError } = await supabase.from("staff").delete().in("id", stale);
    if (delError) console.error("Failed to prune removed pro staff:", delError);
  }
}

export const useStaffStore = create<StaffState>((set, get) => ({
  staff: [],
  selectedStaffIds: [],

  setStaff: (staff) => {
    persistFree(staff, get().selectedStaffIds);
    set({ staff });
  },

  addStaff: (data) => {
    const newStaff: Staff = {
      id: crypto.randomUUID(),
      colour: generateColour(),
      startLocation: "office",
      ...data,
      homePostcode: cleanPostcode(data.homePostcode),
      officePostcode: cleanPostcode(data.officePostcode),
    };

    const staff = [...get().staff, newStaff];
    persistFree(staff, get().selectedStaffIds);
    // Also persist to Supabase if pro
    isPro().then((pro) => {
      if (pro) {
        persistPro(staff, get().selectedStaffIds);
        logActivity("staff_added", null, { staffId: newStaff.id, name: newStaff.name });
      }
    });
    set({ staff });
    return newStaff;
  },

  updateStaff: (id, updates) => {
    const staff = get().staff.map((s) => {
      if (s.id !== id) return s;

      const next: Staff = { ...s, ...updates };

      if (updates.homePostcode !== undefined) {
        next.homePostcode = cleanPostcode(updates.homePostcode);
      }

      if (updates.officePostcode !== undefined) {
        next.officePostcode = cleanPostcode(updates.officePostcode);
      }

      return next;
    });

    persistFree(staff, get().selectedStaffIds);
    isPro().then((pro) => {
      if (pro) {
        persistPro(staff, get().selectedStaffIds);
        logActivity("staff_updated", null, { staffId: id, updates });
      }
    });
    set({ staff });
  },

  deleteStaff: (id) => {
    const removed = get().staff.find((s) => s.id === id);
    const staff = get().staff.filter((s) => s.id !== id);
    const selectedStaffIds = get().selectedStaffIds.filter((x) => x !== id);

    persistFree(staff, selectedStaffIds);
    isPro().then((pro) => {
      if (pro) {
        persistPro(staff, selectedStaffIds);
        logActivity("staff_removed", null, { staffId: id, name: removed?.name });
      }
    });
    set({ staff, selectedStaffIds });
  },

  clearAllStaff: () => {
    persistFree([], []);
    isPro().then((pro) => {
      if (pro) persistPro([], []);
    });
    set({ staff: [], selectedStaffIds: [] });
  },

  setSelectedStaffIds: (ids) => {
    persistFree(get().staff, ids);
    set({ selectedStaffIds: ids });
  },

  loadFromSupabase: async () => {
    const pro = await isPro();
    if (!pro) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("staff")
      .select("*")
      .eq("user_id", user.id);

    if (!data) return;

    const seen = new Set<string>();
    const mapped: Staff[] = data
      .filter((row: StaffRow) => {
        const id = row.local_id;
        if (!id || seen.has(id)) return false;
        seen.add(id);
        return true;
      })
      .map((row: StaffRow) => ({
        id: row.local_id,
        name: row.name ?? "",
        homePostcode: row.home_postcode ?? "",
        officePostcode: row.office_postcode ?? "",
        startLocation: row.start_location === "home" ? "home" : "office",
        dateOfBirth: row.date_of_birth ?? "",
        gender: row.gender ?? "",
        skills: row.skills ?? [],
        colour: row.colour ?? generateColour(),
        workStart: row.work_start ?? undefined,
        breaks: row.breaks ?? [],
        authUserId: row.auth_user_id ?? null,
        workEnd: row.work_end ?? undefined,
      }));

    set({ staff: mapped });
  },
}));

// INITIAL LOAD
if (typeof window !== "undefined") {
  loadFreeSchedulerData().then(async (data) => {
    const store = useStaffStore.getState();

    const pro = await isPro();
    if (pro) {
      await store.loadFromSupabase();
      if (data?.selectedStaffIds?.length) {
        store.setSelectedStaffIds(data.selectedStaffIds);
      }
      return;
    }

    if (data?.staff?.length) {
      store.setStaff(data.staff);
    }
    if (data?.selectedStaffIds?.length) {
      store.setSelectedStaffIds(data.selectedStaffIds);
    }
  });
}
