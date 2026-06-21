// src/store/staffStore.ts
import { create } from "zustand";
import { supabase } from "@/lib/supabase/client";
import {
  loadFreeSchedulerData,
  saveFreeSchedulerData,
  FreeSchedulerData,
} from "@/lib/freeSession";

export type Gender = "Male" | "Female" | "Other";

export type StartLocation = "home" | "office";

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

  // Upsert all staff (replace user's staff)
  // First delete all existing staff for this user, then insert
  const { error: delError } = await supabase
    .from("staff")
    .delete()
    .eq("user_id", user.id);

  if (delError) {
    console.error("Failed to clear pro staff:", delError);
    return;
  }

  if (staff.length === 0) return;

  const { error: insError } = await supabase.from("staff").insert(
    staff.map((s) => ({
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
      start_location: s.startLocation,
      local_id: s.id,
    }))
  );

  if (insError) {
    console.error("Failed to insert pro staff:", insError);
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
      if (pro) persistPro(staff, get().selectedStaffIds);
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
      if (pro) persistPro(staff, get().selectedStaffIds);
    });
    set({ staff });
  },

  deleteStaff: (id) => {
    const staff = get().staff.filter((s) => s.id !== id);
    const selectedStaffIds = get().selectedStaffIds.filter((x) => x !== id);

    persistFree(staff, selectedStaffIds);
    isPro().then((pro) => {
      if (pro) persistPro(staff, selectedStaffIds);
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
      .filter((row: any) => {
        const id = row.local_id;
        if (!id || seen.has(id)) return false;
        seen.add(id);
        return true;
      })
      .map((row: any) => ({
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
