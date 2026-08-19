// src/lib/scheduler/persist.ts

import {
  loadFreeSchedulerData,
  saveFreeSchedulerData,
  updateSchedulerData,
  FreeSchedulerData,
} from "@/lib/freeSession";
import { ScheduledVisit, SchedulerContext, SchedulerResult } from "./types";

/**
 * Reading and writing a schedule, entirely on the user's own machine.
 *
 * These functions used to branch on isFree, sending Pro users' staff,
 * appointments and generated visits to Supabase. Every branch has gone: the
 * rows held client names, home addresses and the times someone would be alone
 * in their house, which is the data this product no longer takes custody of.
 */

type PersistPayload = {
  ctx: SchedulerContext;
  result: SchedulerResult;
};

export async function loadSchedulerData() {
  return loadFreeSchedulerData();
}

export async function saveSchedulerData(data: FreeSchedulerData) {
  await saveFreeSchedulerData(data);
}

export async function saveSchedulerResult({ ctx, result }: PersistPayload) {
  await updateSchedulerData((d) => ({
    ...d,
    staff: ctx.staff,
    appointments: ctx.appointments,
    officePostcode: ctx.officePostcode ?? undefined,
    // Visits are kept so the results tab survives a tab switch, and now so
    // that the schedule is still there tomorrow morning.
    visits: result.visits,
  }));
}

export async function clearSchedulerResult() {
  await updateSchedulerData((d) => ({ ...d, visits: [] }));
}

export async function loadScheduledVisits(): Promise<ScheduledVisit[]> {
  const data = await loadFreeSchedulerData();
  return data?.visits ?? [];
}
