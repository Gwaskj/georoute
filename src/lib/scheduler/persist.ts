// C:\Users\matth\georoute\src\lib\scheduler\persist.ts
import { supabase } from "@/lib/supabase/client";
import {
  loadFreeSchedulerData,
  saveFreeSchedulerData,
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

  const [staffRes, apptRes, routesRes, visitsRes] = await Promise.all([
    supabase.from("staff").select("*"),
    supabase.from("appointments").select("*"),
    supabase.from("routes").select("*"),
    supabase.from("visits").select("*"),
  ]);

  return {
    staff: staffRes.data ?? [],
    appointments: apptRes.data ?? [],
    routes: routesRes.data ?? [],
    visits: visitsRes.data ?? [],
  };
}

export async function saveSchedulerData(
  isFree: boolean,
  data: Record<string, any>
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
  if (data.visits) {
    await supabase.from("visits").upsert(data.visits);
  }
}

export async function saveSchedulerResult({
  isFree,
  ctx,
  result,
}: PersistPayload) {
  const { visits } = result;

  if (isFree) {
    const existing = (await loadFreeSchedulerData()) ?? {};

    const updated = {
      ...existing,
      staff: ctx.staff,
      appointments: ctx.appointments,
      purposes: ctx.purposes,
      windows: ctx.windows,
      dayStart: ctx.dayStart,
      dayEnd: ctx.dayEnd,
      officePostcode: ctx.officePostcode,
      visits,
    };

    await saveFreeSchedulerData(updated);
    return;
  }

  await supabase.from("visits").delete().neq("id", ""); // clear old
  await supabase.from("visits").insert(visits);
}
