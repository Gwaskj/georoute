import type { Staff } from "@/store/staffStore";
import type { Appointment } from "@/store/appointmentStore";
import type { SchedulerContext } from "./types";

/**
 * Builders for scheduler tests.
 *
 * Every field the engine reads gets a sensible default so a test only states
 * what it is actually about. A test for minimum gaps should not have to invent
 * a gender, a skill list and a pair of postcodes to say what it means.
 */

export function staff(over: Partial<Staff> = {}): Staff {
  return {
    id: over.id ?? `s-${Math.random().toString(36).slice(2, 8)}`,
    name: "Carer",
    homePostcode: "LS1 1UR",
    officePostcode: "",
    startLocation: "home",
    gender: "",
    skills: [],
    workStart: "08:00",
    workEnd: "18:00",
    breaks: [],
    ...over,
  } as Staff;
}

export function appointment(over: Partial<Appointment> = {}): Appointment {
  return {
    id: over.id ?? `a-${Math.random().toString(36).slice(2, 8)}`,
    name: "Client",
    address: "",
    postcode: "LS1 4DY",
    durationMinutes: 30,
    requiredStaff: 1,
    visitsRequired: 1,
    minGapMinutes: 0,
    strictStartTime: null,
    purposeId: null,
    // requiredSkills, not skills -- the staff member has skills, the
    // appointment states which of them it requires.
    requiredSkills: [],
    ...over,
  } as Appointment;
}

/**
 * Travel times from an explicit table, defaulting to a fixed cost.
 *
 * The engine falls back to a flat 10 minutes when no lookup is supplied, which
 * makes every staff member equidistant from everything -- fine for tests about
 * ordering, useless for tests about which staff member is nearest. Supplying a
 * table is what lets a test assert that geography influenced the outcome.
 */
export function travel(
  table: Record<string, number> = {},
  fallback = 10
): (from: string, to: string) => number {
  return (from, to) => {
    if (from === to) return 0;
    return table[`${from}->${to}`] ?? table[`${to}->${from}`] ?? fallback;
  };
}

export function context(over: Partial<SchedulerContext> = {}): SchedulerContext {
  return {
    staff: [],
    appointments: [],
    purposes: [],
    windows: [],
    officePostcode: "LS1 1UR",
    dayStart: "08:00",
    dayEnd: "18:00",
    ...over,
  };
}

/**
 * Minutes from midnight, in local time.
 *
 * Local, not UTC, because the engine builds times from "08:00" style strings
 * in the machine's own timezone -- a visit at 08:10 during BST serialises as
 * 07:10Z, so reading it back in UTC would put every assertion an hour out for
 * half the year and be correct for the other half.
 */
export function minutesOf(iso: string): number {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

/** 570 -> "09:30". Turns a failure message into something you can read. */
export function hhmm(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
