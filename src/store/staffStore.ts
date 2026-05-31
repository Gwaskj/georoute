// src/store/staffStore.ts
import { create } from "zustand";
import {
  loadFreeSchedulerData,
  saveFreeSchedulerData,
  FreeSchedulerData,
} from "@/lib/freeSession";

export type Gender = "Male" | "Female" | "Other";

export interface Staff {
  id: string;
  name: string;
  homePostcode: string;
  officePostcode: string;
  dateOfBirth: string;
  gender: Gender | "";
  skills: string[];
  colour: string;
}

interface StaffState {
  staff: Staff[];
  selectedStaffIds: string[];
  setStaff: (staff: Staff[]) => void;
  addStaff: (staff: Omit<Staff, "id" | "colour">) => Staff;
  updateStaff: (id: string, updates: Partial<Staff>) => void;
  deleteStaff: (id: string) => void;
  setSelectedStaffIds: (ids: string[]) => void;
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
      ...data,
      homePostcode: cleanPostcode(data.homePostcode),
      officePostcode: cleanPostcode(data.officePostcode),
    };

    const staff = [...get().staff, newStaff];
    persistFree(staff, get().selectedStaffIds);
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
    set({ staff });
  },

  deleteStaff: (id) => {
    const staff = get().staff.filter((s) => s.id !== id);
    const selectedStaffIds = get().selectedStaffIds.filter((x) => x !== id);

    persistFree(staff, selectedStaffIds);
    set({ staff, selectedStaffIds });
  },

  setSelectedStaffIds: (ids) => {
    persistFree(get().staff, ids);
    set({ selectedStaffIds: ids });
  },
}));

// INITIAL LOAD
if (typeof window !== "undefined") {
  loadFreeSchedulerData().then((data) => {
    if (data?.staff?.length) {
      useStaffStore.getState().setStaff(data.staff);
    }
    if (data?.selectedStaffIds?.length) {
      useStaffStore.getState().setSelectedStaffIds(data.selectedStaffIds);
    }
  });
}
