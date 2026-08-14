// src/lib/scheduler/types.ts

import { Staff } from "@/store/staffStore";
import { Appointment } from "@/store/appointmentStore";
import { CallPurpose } from "@/store/callPurposeStore";
import { CustomWindow } from "@/store/customWindowStore";

export interface ScheduledVisit {
  id: string;
  appointmentId: string;
  staffId: string;
  clientName: string;
  staffName: string;
  start: string;   // ISO datetime
  end: string;     // ISO datetime
  postcode: string;
  address?: string;
  windowName?: string;
}

export interface SchedulerContext {
  staff: Staff[];
  appointments: Appointment[];
  purposes: CallPurpose[];
  windows: CustomWindow[];
  officePostcode: string | null;
  dayStart: string; // "08:00"
  dayEnd: string;   // "20:00"
  /**
   * The day being planned, as "YYYY-MM-DD".
   *
   * Every visit time is built by adding minutes to midnight on this date, so
   * it decides what date the resulting timestamps carry. Omitting it means
   * today, which is what the engine did unconditionally before this existed --
   * so planning next Tuesday produced a round stamped with today's date, which
   * then went into scheduled_visits and onto the link staff are sent.
   */
  planningDate?: string;
  /** Custom travel time lookup (fromPostcode, toPostcode) => minutes.
   *  If not provided, falls back to a hardcoded 10 minutes. */
  getTravelMinutes?: (fromPostcode: string, toPostcode: string) => number;
}

/** A break the scheduler reserved in a staff member's day. */
export interface ScheduledBreak {
  id: string;
  breakId: string;
  staffId: string;
  staffName: string;
  start: string; // ISO datetime
  end: string;   // ISO datetime
}

export interface SchedulerResult {
  visits: ScheduledVisit[];
  /** Breaks that were reserved. Empty when no staff member has one. */
  breaks: ScheduledBreak[];
  warnings: string[];
  hints: string[];
}
