// src/store/staffStore.ts

import { create } from "zustand";
import { normalisePostcode } from "@/lib/validatePostcode";

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

const STORAGE_KEY = "georoute_staff";

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

function loadInitialStaff(): Staff[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Staff[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistStaff(staff: Staff[]) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(staff));
  } catch {}
}

export const useStaffStore = create<StaffState>((set, get) => ({
  staff: [],
  selectedStaffIds: [],

  setStaff: (staff) => {
    persistStaff(staff);
    set({ staff });
  },

  addStaff: (data) => {
    const newStaff: Staff = {
      id: crypto.randomUUID(),
      colour: generateColour(),
      ...data,
      homePostcode: normalisePostcode(data.homePostcode),
      officePostcode: normalisePostcode(data.officePostcode),
    };

    const staff = [...get().staff, newStaff];
    persistStaff(staff);
    set({ staff });
    return newStaff;
  },

  updateStaff: (id, updates) => {
    const staff = get().staff.map((s) => {
      if (s.id !== id) return s;

      const next: Staff = {
        ...s,
        ...updates,
      };

      if (updates.homePostcode !== undefined) {
        next.homePostcode = normalisePostcode(updates.homePostcode);
      }

      if (updates.officePostcode !== undefined) {
        next.officePostcode = normalisePostcode(updates.officePostcode);
      }

      return next;
    });

    persistStaff(staff);
    set({ staff });
  },

  deleteStaff: (id) => {
    const staff = get().staff.filter((s) => s.id !== id);
    persistStaff(staff);
    set({
      staff,
      selectedStaffIds: get().selectedStaffIds.filter((x) => x !== id),
    });
  },

  setSelectedStaffIds: (ids) => set({ selectedStaffIds: ids }),
}));

if (typeof window !== "undefined") {
  const initial = loadInitialStaff();
  if (initial.length) {
    useStaffStore.getState().setStaff(initial);
  }
}
