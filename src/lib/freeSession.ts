"use client";

export type FreeSchedulerData = {
  staff: any[];
  appointments: any[];
  routes: any[];
  officePostcode?: string;
  selectedStaffIds?: string[];
  visits?: any[];
};

const STORAGE_KEY = "free_scheduler_data";

// Load free-tier data (session only)
export async function loadFreeSchedulerData(): Promise<FreeSchedulerData | null> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Save free-tier data (session only)
export async function saveFreeSchedulerData(payload: FreeSchedulerData): Promise<void> {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {}
}
