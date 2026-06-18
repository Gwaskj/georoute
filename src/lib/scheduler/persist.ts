// src/lib/scheduler/persist.ts

import { supabase } from "@/lib/supabase/client";
import {
  loadFreeSchedulerData,
  saveFreeSchedulerData,
  FreeSchedulerData,
} from "@/lib/freeSession";
import { ScheduledVisit, SchedulerContext, SchedulerResult } from "./types";

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

  // Pro mode: persist visits to Supabase
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("scheduled_visits").delete().eq("user_id", user.id);

  if (visits.length === 0) return;

  await supabase.from("scheduled_visits").insert(
    visits.map((v) => ({
      user_id: user.id,
      visit_id: v.id,
      appointment_id: v.appointmentId,
      staff_id: v.staffId,
      client_name: v.clientName,
      staff_name: v.staffName,
      start_time: v.start,
      end_time: v.end,
      postcode: v.postcode,
      address: v.address,
      window_name: v.windowName,
    }))
  );
}

export async function clearSchedulerResult(isFree: boolean) {
  if (isFree) {
    const existing: FreeSchedulerData = (await loadFreeSchedulerData()) ?? {
      staff: [],
      appointments: [],
      routes: [],
    };
    await saveFreeSchedulerData({ ...existing, visits: [] });
    return;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("scheduled_visits").delete().eq("user_id", user.id);
}

export async function loadProScheduledVisits(): Promise<ScheduledVisit[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("scheduled_visits")
    .select("*")
    .eq("user_id", user.id)
    .order("start_time", { ascending: true });

  if (!data) return [];

  return data.map((row: any) => ({
    id: row.visit_id,
    appointmentId: row.appointment_id ?? "",
    staffId: row.staff_id ?? "",
    clientName: row.client_name ?? "",
    staffName: row.staff_name ?? "",
    start: row.start_time,
    end: row.end_time,
    postcode: row.postcode ?? "",
    address: row.address ?? undefined,
    windowName: row.window_name ?? undefined,
  }));
}
