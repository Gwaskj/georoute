"use client";

export type FreeSchedulerData = {
  staff: any[];
  appointments: any[];
  routes: any[];
  windows?: any[];
  skills?: any[];                 // ← ADDED
  officePostcode?: string;
  selectedStaffIds?: string[];
  visits?: any[];
};

const STORAGE_KEY = "free_scheduler_data";

export async function loadFreeSchedulerData(): Promise<FreeSchedulerData | null> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        staff: [],
        appointments: [],
        routes: [],
        windows: [],
        skills: [],              // ← ADDED
        officePostcode: "",
        selectedStaffIds: [],
        visits: [],
      };
    }

    const parsed = JSON.parse(raw);

    return {
      staff: parsed.staff ?? [],
      appointments: parsed.appointments ?? [],
      routes: parsed.routes ?? [],
      windows: parsed.windows ?? [],
      skills: parsed.skills ?? [],       // ← ADDED
      officePostcode: parsed.officePostcode ?? "",
      selectedStaffIds: parsed.selectedStaffIds ?? [],
      visits: parsed.visits ?? [],
    };
  } catch {
    return {
      staff: [],
      appointments: [],
      routes: [],
      windows: [],
      skills: [],                // ← ADDED
      officePostcode: "",
      selectedStaffIds: [],
      visits: [],
    };
  }
}

export async function saveFreeSchedulerData(payload: FreeSchedulerData): Promise<void> {
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        staff: payload.staff ?? [],
        appointments: payload.appointments ?? [],
        routes: payload.routes ?? [],
        windows: payload.windows ?? [],
        skills: payload.skills ?? [],     // ← ADDED
        officePostcode: payload.officePostcode ?? "",
        selectedStaffIds: payload.selectedStaffIds ?? [],
        visits: payload.visits ?? [],
      })
    );
  } catch {}
}
