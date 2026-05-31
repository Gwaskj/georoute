// src/lib/scheduler/persist.ts

import { supabase } from "@/lib/supabase/client";
import {
  loadFreeSchedulerData,
  saveFreeSchedulerData,
  FreeSchedulerData,
} from "@/lib/freeSession";
import { SchedulerContext, SchedulerResult } from "./types";

type PersistPayload = {
  isFree: boolean;
  ctx: SchedulerContext;
  result: SchedulerResult;
};

export async function loadSchedulerData(isFree: boolean) {
  if (isFree) {
    return await loadFreeSchedulerData();
  }

  const [staffRes, apptRes, routesRes] = await Promise.all([
    supabase.from("staff").select("*"),
    supabase.from("appointments").select("*"),
    supabase.from("routes").select("*"),
  ]);

  return {
    staff: staffRes.data ?? [],
    appointments: apptRes.data ?? [],
    routes: routesRes.data ?? [],
  };
}

export async function saveSchedulerData(
  isFree: boolean,
  data: FreeSchedulerData
) {
  if (isFree) {
    await saveFreeSchedulerData(data);
    return;
  }

  if (data.staff) {
    await supabase.from("staff").upsert(data.staff);
  }
  if (data.appointments) {
    await supabase.from("appointments").upsert(data.appointments);
  }
  if (data.routes) {
    await supabase.from("routes").upsert(data.routes);
  }
}

export async function saveSchedulerResult({
  isFree,
  ctx,
  result,
}: PersistPayload) {
  const { visits } = result;

  if (isFree) {
    const existing: FreeSchedulerData = (await loadFreeSchedulerData()) ?? {
      staff: [],
      appointments: [],
      routes: [],
    };

    const updated: FreeSchedulerData = {
      ...existing,
      staff: ctx.staff,
      appointments: ctx.appointments,
      routes: existing.routes ?? [],
      officePostcode: ctx.officePostcode ?? null,
      selectedStaffIds: existing.selectedStaffIds ?? [],
    };

    // Free mode keeps visits only for UI display
    (updated as any).visits = visits;

    await saveFreeSchedulerData(updated);
    return;
  }

  // Pro mode: visits are NOT persisted
}
