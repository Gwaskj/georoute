// Exceptions to a recurring appointment: one occurrence skipped, or moved to a
// different date, without disturbing the rest of the series.

import { create } from "zustand";
import { supabase } from "@/lib/supabase/client";
import { loadFreeSchedulerData, updateSchedulerData } from "@/lib/freeSession";
import type { RecurrenceException } from "@/lib/recurrence/occurrences";

export interface AppointmentException extends RecurrenceException {
  id: string;
  /** The appointment's local id. */
  appointmentId: string;
}

interface ExceptionState {
  exceptions: AppointmentException[];
  /** All exceptions for one appointment, in the shape the expander wants. */
  forAppointment: (appointmentId: string) => RecurrenceException[];
  skipOccurrence: (appointmentId: string, onDate: string) => Promise<void>;
  moveOccurrence: (
    appointmentId: string,
    onDate: string,
    movedToDate: string
  ) => Promise<void>;
  /** Undo a skip or move, restoring the occurrence to its original date. */
  clearException: (appointmentId: string, onDate: string) => Promise<void>;
  load: (isFree: boolean) => Promise<void>;
}

async function isPro(): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("profiles")
    .select("is_pro")
    .eq("user_id", user.id)
    .maybeSingle();
  return data?.is_pro === true;
}

async function persistFree(exceptions: AppointmentException[]) {
  await updateSchedulerData((d) => ({ ...d, exceptions }));
}

/**
 * Upsert one exception. Scoped per occurrence rather than rewriting the whole
 * list, so a failure affects only the change being made -- the delete-then-
 * insert pattern this project used elsewhere is what loses data.
 */
async function persistOne(ex: AppointmentException) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from("appointment_exceptions").upsert(
    {
      user_id: user.id,
      appointment_local_id: ex.appointmentId,
      on_date: ex.onDate,
      action: ex.action,
      moved_to_date: ex.movedToDate ?? null,
    },
    { onConflict: "user_id,appointment_local_id,on_date" }
  );

  if (error) console.error("Failed to save appointment exception:", error);
}

async function removeOne(appointmentId: string, onDate: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("appointment_exceptions")
    .delete()
    .eq("user_id", user.id)
    .eq("appointment_local_id", appointmentId)
    .eq("on_date", onDate);

  if (error) console.error("Failed to remove appointment exception:", error);
}

export const useExceptionStore = create<ExceptionState>((set, get) => ({
  exceptions: [],

  forAppointment: (appointmentId) =>
    get()
      .exceptions.filter((e) => e.appointmentId === appointmentId)
      .map((e) => ({
        onDate: e.onDate,
        action: e.action,
        movedToDate: e.movedToDate,
      })),

  skipOccurrence: async (appointmentId, onDate) => {
    // Replace rather than append: one instruction per occurrence, matching the
    // unique index, so expansion can never find two conflicting rules.
    const next: AppointmentException = {
      id: crypto.randomUUID(),
      appointmentId,
      onDate,
      action: "skip",
      movedToDate: null,
    };
    const exceptions = [
      ...get().exceptions.filter(
        (e) => !(e.appointmentId === appointmentId && e.onDate === onDate)
      ),
      next,
    ];
    set({ exceptions });
    persistFree(exceptions);
    if (await isPro()) await persistOne(next);
  },

  moveOccurrence: async (appointmentId, onDate, movedToDate) => {
    const next: AppointmentException = {
      id: crypto.randomUUID(),
      appointmentId,
      onDate,
      action: "move",
      movedToDate,
    };
    const exceptions = [
      ...get().exceptions.filter(
        (e) => !(e.appointmentId === appointmentId && e.onDate === onDate)
      ),
      next,
    ];
    set({ exceptions });
    persistFree(exceptions);
    if (await isPro()) await persistOne(next);
  },

  clearException: async (appointmentId, onDate) => {
    const exceptions = get().exceptions.filter(
      (e) => !(e.appointmentId === appointmentId && e.onDate === onDate)
    );
    set({ exceptions });
    persistFree(exceptions);
    if (await isPro()) await removeOne(appointmentId, onDate);
  },

  load: async (isFree) => {
    if (isFree) {
      const data = await loadFreeSchedulerData();
      set({ exceptions: (data as { exceptions?: AppointmentException[] })?.exceptions ?? [] });
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("appointment_exceptions")
      .select("*")
      .eq("user_id", user.id);

    set({
      exceptions: (data ?? []).map((row: Record<string, unknown>) => ({
        id: String(row.id),
        appointmentId: (row.appointment_local_id as string) ?? "",
        onDate: (row.on_date as string) ?? "",
        action: (row.action as "skip" | "move") ?? "skip",
        movedToDate: (row.moved_to_date as string | null) ?? null,
      })),
    });
  },
}));
