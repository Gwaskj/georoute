// Exceptions to a recurring appointment: one occurrence skipped, or moved to a
// different date, without disturbing the rest of the series.

import { create } from "zustand";
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
  load: () => Promise<void>;
}

async function persist(exceptions: AppointmentException[]) {
  await updateSchedulerData((d) => ({ ...d, exceptions }));
}

/**
 * Replace any existing rule for the same occurrence rather than appending.
 *
 * One instruction per occurrence, so expansion can never find two conflicting
 * rules for the same date.
 */
function replacing(
  exceptions: AppointmentException[],
  appointmentId: string,
  onDate: string,
  next?: AppointmentException
): AppointmentException[] {
  const without = exceptions.filter(
    (e) => !(e.appointmentId === appointmentId && e.onDate === onDate)
  );
  return next ? [...without, next] : without;
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
    const exceptions = replacing(get().exceptions, appointmentId, onDate, {
      id: crypto.randomUUID(),
      appointmentId,
      onDate,
      action: "skip",
      movedToDate: null,
    });
    set({ exceptions });
    await persist(exceptions);
  },

  moveOccurrence: async (appointmentId, onDate, movedToDate) => {
    const exceptions = replacing(get().exceptions, appointmentId, onDate, {
      id: crypto.randomUUID(),
      appointmentId,
      onDate,
      action: "move",
      movedToDate,
    });
    set({ exceptions });
    await persist(exceptions);
  },

  clearException: async (appointmentId, onDate) => {
    const exceptions = replacing(get().exceptions, appointmentId, onDate);
    set({ exceptions });
    await persist(exceptions);
  },

  load: async () => {
    const data = await loadFreeSchedulerData();
    set({
      exceptions:
        (data as { exceptions?: AppointmentException[] })?.exceptions ?? [],
    });
  },
}));
