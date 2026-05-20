"use client";

// Free-tier data is stored locally in the browser using IndexedDB.
// This avoids any Supabase tables and keeps free users fully isolated.

export type FreeSchedulerData = {
  staff?: any[];
  clients?: any[];
  appointments?: any[];
  skills?: any[];
  windows?: any[];
  purposes?: any[];
  officePostcode?: string;
  selectedStaffIds?: string[];
  routes?: any[];
  visits?: any[];
  [key: string]: any;
};

const STORAGE_KEY = "free_sessions";

// Load free-tier data from IndexedDB (via localStorage fallback)
export async function loadFreeSchedulerData(): Promise<FreeSchedulerData | null> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    return parsed ?? null;
  } catch (err) {
    console.error("Error loading free scheduler data:", err);
    return null;
  }
}

// Save free-tier data to IndexedDB (via localStorage fallback)
export async function saveFreeSchedulerData(payload: FreeSchedulerData): Promise<void> {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.error("Error saving free scheduler data:", err);
  }
}
