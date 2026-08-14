"use client";

import type { Staff } from "@/store/staffStore";
import type { Appointment } from "@/store/appointmentStore";
import type { Skill } from "@/store/skillsStore";
import type { CustomWindow } from "@/store/customWindowStore";
import type { ScheduledVisit } from "@/lib/scheduler/types";

/**
 * Everything free mode keeps, held in sessionStorage rather than the database.
 *
 * These were all `any[]`, which meant the free path had no type checking at
 * all -- the one path where a mistake is hardest to notice, because nothing is
 * persisted for anyone to inspect afterwards. They are the same shapes the Pro
 * path stores in Supabase; only the destination differs.
 */
export type FreeSchedulerData = {
  staff: Staff[];
  appointments: Appointment[];
  /** Cached routing results, opaque here -- only the map layer reads them. */
  routes: unknown[];
  windows?: CustomWindow[];
  skills?: Skill[];
  officePostcode?: string;
  selectedStaffIds?: string[];
  /** Kept purely so the results tab survives a tab switch; never authoritative. */
  visits?: ScheduledVisit[];
  /** Skipped or moved occurrences of recurring appointments. */
  exceptions?: unknown[];
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
      exceptions: parsed.exceptions ?? [],
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
        exceptions: payload.exceptions ?? [],
      })
    );
  } catch {}
}
