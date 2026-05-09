import { create } from "zustand";

export type Gender = "Male" | "Female" | "Other";

export interface Staff {
  id: string;
  name: string;
  homePostcode: string;
  officePostcode: string;
  dateOfBirth: string; // ISO string
  gender: Gender | "";
  skillIds: string[];
  archived: boolean;
}

interface StaffState {
  staff: Staff[];
  selectedStaffIds: string[];
  setStaff: (staff: Staff[]) => void;
  addStaff: (staff: Omit<Staff, "id" | "archived">) => Staff;
  updateStaff: (id: string, updates: Partial<Staff>) => void;
  deleteStaff: (id: string) => void;
  duplicateStaff: (id: string) => void;
  archiveStaff: (id: string) => void;
  setSelectedStaffIds: (ids: string[]) => void;
}

const STORAGE_KEY = "georoute_staff";

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
  } catch {
    // ignore
  }
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
      archived: false,
      ...data,
    };
    const staff = [...get().staff, newStaff];
    persistStaff(staff);
    set({ staff });
    return newStaff;
  },
  updateStaff: (id, updates) => {
    const staff = get().staff.map((s) =>
      s.id === id ? { ...s, ...updates } : s
    );
    persistStaff(staff);
    set({ staff });
  },
  deleteStaff: (id) => {
    const staff = get().staff.filter((s) => s.id !== id);
    persistStaff(staff);
    set({ staff, selectedStaffIds: get().selectedStaffIds.filter((x) => x !== id) });
  },
  duplicateStaff: (id) => {
    const original = get().staff.find((s) => s.id === id);
    if (!original) return;
    const copy: Staff = {
      ...original,
      id: crypto.randomUUID(),
      name: `${original.name} (copy)`,
      archived: false,
    };
    const staff = [...get().staff, copy];
    persistStaff(staff);
    set({ staff });
  },
  archiveStaff: (id) => {
    const staff = get().staff.map((s) =>
      s.id === id ? { ...s, archived: true } : s
    );
    persistStaff(staff);
    set({ staff });
  },
  setSelectedStaffIds: (ids) => set({ selectedStaffIds: ids }),
}));

// hydrate from sessionStorage on first import (browser only)
if (typeof window !== "undefined") {
  const initial = loadInitialStaff();
  if (initial.length) {
    useStaffStore.getState().setStaff(initial);
  }
}
