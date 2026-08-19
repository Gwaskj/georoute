// src/store/staffStore.ts
import { create } from "zustand";
import { loadFreeSchedulerData, updateSchedulerData } from "@/lib/freeSession";

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

export interface Staff {
  id: string;
  name: string;
  homePostcode: string;
  officePostcode: string;
  startLocation: StartLocation;
  gender: Gender | "";
  skills: string[];
  colour: string;
  workStart?: string;
  workEnd?: string;
  /** Unpaid breaks. Empty or omitted means none. */
  breaks?: StaffBreak[];
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

async function persist(staff: Staff[], selectedStaffIds: string[]) {
  await updateSchedulerData((d) => ({ ...d, staff, selectedStaffIds }));
}

export const useStaffStore = create<StaffState>((set, get) => ({
  staff: [],
  selectedStaffIds: [],

  setStaff: (staff) => {
    persist(staff, get().selectedStaffIds);
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
    persist(staff, get().selectedStaffIds);
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

    persist(staff, get().selectedStaffIds);
    set({ staff });
  },

  deleteStaff: (id) => {
    const staff = get().staff.filter((s) => s.id !== id);
    const selectedStaffIds = get().selectedStaffIds.filter((x) => x !== id);

    persist(staff, selectedStaffIds);
    set({ staff, selectedStaffIds });
  },

  clearAllStaff: () => {
    persist([], []);
    set({ staff: [], selectedStaffIds: [] });
  },

  setSelectedStaffIds: (ids) => {
    persist(get().staff, ids);
    set({ selectedStaffIds: ids });
  },
}));

// INITIAL LOAD
if (typeof window !== "undefined") {
  loadFreeSchedulerData().then((data) => {
    const store = useStaffStore.getState();

    if (data?.staff?.length) store.setStaff(data.staff);
    if (data?.selectedStaffIds?.length) {
      store.setSelectedStaffIds(data.selectedStaffIds);
    }
  });
}
