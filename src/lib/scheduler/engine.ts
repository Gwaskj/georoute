// src/lib/scheduler/engine.ts
import { SchedulerContext, SchedulerResult, ScheduledVisit } from "./types";
import { Appointment } from "@/store/appointmentStore";
import { Staff } from "@/store/staffStore";
import { CallPurpose } from "@/store/callPurposeStore";
import { CustomWindow } from "@/store/customWindowStore";

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map((v) => parseInt(v, 10));
  return h * 60 + m;
}

// Fallback travel time used when no getTravelMinutes is provided
function estimateTravelMinutes(
  _fromPostcode: string,
  _toPostcode: string
): number {
  return 10;
}

function getPurposeWindow(
  appointment: Appointment,
  purposes: CallPurpose[]
): { start: number; end: number } | null {
  if (!appointment.purposeId) return null;
  const p = purposes.find((x) => x.id === appointment.purposeId);
  if (!p) return null;
  return { start: toMinutes(p.start), end: toMinutes(p.end) };
}

type CustomWindowSlot = {
  id: string;
  start: number;
  end: number;
  minGapToNext: number;
};

function getCustomWindows(windows: CustomWindow[]): CustomWindowSlot[] {
  return windows
    .slice()
    .sort((a, b) => toMinutes(a.start) - toMinutes(b.start))
    .map((w) => ({
      id: w.id,
      start: toMinutes(w.start),
      end: toMinutes(w.end),
      minGapToNext: w.minGapToNext,
    }));
}

interface StaffTimelineSlot {
  start: number;
  end: number;
  postcode: string;
}

/** A visit recorded against a client for per-client gap enforcement. */
interface ClientVisitRecord {
  start: number;
  end: number;
  /** minGapToNext from the window used for this visit */
  minGapToNext: number;
}

function staffHasRequiredSkills(staff: Staff, appointment: Appointment): boolean {
  const required = appointment.requiredSkills ?? [];
  if (required.length === 0) return true;
  const skills = staff.skills ?? [];
  return required.every((skill) => skills.includes(skill));
}

function staffMatchesGender(staff: Staff, appointment: Appointment): boolean {
  if (!appointment.staffGender) return true;
  return staff.gender === appointment.staffGender;
}

/**
 * Check that a candidate slot [candidateStart, candidateEnd] does not violate
 * per-client gap constraints. The gap is enforced in both directions:
 * - an existing visit's end + its minGapToNext must be <= candidateStart
 * - candidateEnd + newMinGapToNext must be <= an existing visit's start
 */
function clientGapOk(
  candidateStart: number,
  candidateEnd: number,
  clientVisits: ClientVisitRecord[],
  newMinGapToNext: number
): boolean {
  for (const v of clientVisits) {
    if (v.start <= candidateStart) {
      // Existing visit is earlier — check gap from it to the candidate
      if (v.end + v.minGapToNext > candidateStart) return false;
    } else {
      // Existing visit is later — check gap from candidate to it
      if (candidateEnd + newMinGapToNext > v.start) return false;
    }
  }
  return true;
}

function findSlotForVisit(
  staff: Staff,
  existing: StaffTimelineSlot[],
  visitDuration: number,
  dayStart: number,
  dayEnd: number,
  clientPostcode: string,
  strictStartMinutes: number | null,
  window: { start: number; end: number } | null,
  minGapMinutes: number,
  officePostcode: string | null,
  travelMin: (from: string, to: string) => number,
  clientVisits: ClientVisitRecord[],
  windowMinGapToNext: number
): { start: number; end: number } | null {
  const baseStart = window ? Math.max(dayStart, window.start) : dayStart;
  const baseEnd = window ? Math.min(dayEnd, window.end) : dayEnd;

  // ── STRICT START TIME ──────────────────────────────────
  if (strictStartMinutes !== null) {
    const desiredStart = strictStartMinutes;
    const desiredEnd = desiredStart + visitDuration;

    if (desiredStart < baseStart || desiredEnd > baseEnd) return null;

    for (const slot of existing) {
      const travelBefore = travelMin(slot.postcode, clientPostcode);
      const travelAfter = travelMin(clientPostcode, slot.postcode);

      const slotBufferedStart = slot.start - travelBefore - minGapMinutes;
      const slotBufferedEnd = slot.end + travelAfter + minGapMinutes;

      if (desiredStart < slotBufferedEnd && desiredEnd > slotBufferedStart) {
        return null;
      }
    }

    if (!clientGapOk(desiredStart, desiredEnd, clientVisits, windowMinGapToNext)) {
      return null;
    }

    return { start: desiredStart, end: desiredEnd };
  }

  // ── DYNAMIC (NON-STRICT) SCHEDULING ────────────────────
  const sorted = existing.slice().sort((a, b) => a.start - b.start);

  let current = baseStart;

  for (const slot of sorted) {
    const travelBefore = travelMin(slot.postcode, clientPostcode);
    const travelAfter = travelMin(clientPostcode, slot.postcode);

    const earliestStart = current;
    const latestEnd = earliestStart + visitDuration;

    if (
      latestEnd + travelAfter <= slot.start - minGapMinutes &&
      earliestStart - travelBefore >= baseStart
    ) {
      if (
        earliestStart >= baseStart &&
        latestEnd <= baseEnd &&
        clientGapOk(earliestStart, latestEnd, clientVisits, windowMinGapToNext)
      ) {
        return { start: earliestStart, end: latestEnd };
      }
    }

    current = Math.max(current, slot.end + minGapMinutes);
  }

  const originPostcode = staff.officePostcode || officePostcode || "";
  const travelFromOffice = travelMin(originPostcode, clientPostcode);
  const start = current + travelFromOffice;
  const end = start + visitDuration;

  if (
    start >= baseStart &&
    end <= baseEnd &&
    clientGapOk(start, end, clientVisits, windowMinGapToNext)
  ) {
    return { start, end };
  }

  return null;
}

function makeISOVisit(
  baseDate: Date,
  appt: Appointment,
  s: Staff,
  startTime: number,
  endTime: number,
  windowName?: string
): ScheduledVisit {
  const startDate = new Date(baseDate.getTime() + startTime * 60 * 1000);
  const endDate = new Date(baseDate.getTime() + endTime * 60 * 1000);
  return {
    id: crypto.randomUUID(),
    appointmentId: appt.id,
    staffId: s.id,
    clientName: appt.name,
    staffName: s.name,
    start: startDate.toISOString(),
    end: endDate.toISOString(),
    postcode: appt.postcode,
    address: appt.address,
    windowName,
  };
}

export function runScheduler(ctx: SchedulerContext): SchedulerResult {
  const {
    staff,
    appointments,
    purposes,
    windows,
    dayStart,
    dayEnd,
    officePostcode,
    getTravelMinutes,
  } = ctx;

  const travelMin = getTravelMinutes ?? estimateTravelMinutes;

  const warnings: string[] = [];
  const visits: ScheduledVisit[] = [];

  const dayStartMin = toMinutes(dayStart);
  const dayEndMin = toMinutes(dayEnd);

  const staffTimelines = new Map<string, StaffTimelineSlot[]>();
  staff.forEach((s) => staffTimelines.set(s.id, []));

  /** Per-client gap tracking. Keyed by lowercase trimmed client name. */
  const clientScheduled = new Map<string, ClientVisitRecord[]>();

  function getClientVisits(name: string): ClientVisitRecord[] {
    return clientScheduled.get(name.toLowerCase().trim()) ?? [];
  }

  function recordClientVisit(
    name: string,
    start: number,
    end: number,
    minGapToNext: number
  ) {
    const key = name.toLowerCase().trim();
    const existing = clientScheduled.get(key) ?? [];
    clientScheduled.set(key, [...existing, { start, end, minGapToNext }]);
  }

  const today = new Date();
  const baseDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    0, 0, 0, 0
  );

  const customWindows = getCustomWindows(windows);

  type ExpandedVisit = { appt: Appointment; visitIndex: number };

  const expanded: ExpandedVisit[] = [];
  for (const appt of appointments.filter((a) => !a.archived)) {
    const count = Math.max(1, appt.visitsRequired || 1);
    for (let i = 0; i < count; i++) {
      expanded.push({ appt, visitIndex: i });
    }
  }

  const expandedSorted = expanded.slice().sort((a, b) => {
    const getKey = ({ appt, visitIndex }: ExpandedVisit): number => {
      const strict = appt.strictStartTime ? toMinutes(appt.strictStartTime) : null;
      if (strict !== null) return strict;
      const pw = getPurposeWindow(appt, purposes);
      if (pw) return pw.start;
      const reqIds = appt.requiredWindows ?? [];
      if (reqIds.length > 0 && visitIndex < reqIds.length) {
        const w = customWindows.find((cw) => reqIds.includes(cw.id));
        if (w) return w.start;
      }
      return dayStartMin;
    };
    return getKey(a) - getKey(b);
  });

  for (const { appt, visitIndex } of expandedSorted) {
    const duration = appt.durationMinutes || 30;
    const minGapBase = appt.minGapMinutes ?? 120;
    const strict = appt.strictStartTime ? toMinutes(appt.strictStartTime) : null;
    const purposeWindow = getPurposeWindow(appt, purposes);

    const requiredWindowIds = appt.requiredWindows ?? [];
    // A visit is window-constrained only when its index falls within the number
    // of selected windows. Extra visits (visitIndex >= windows count) are free
    // to be scheduled at any point during the day.
    const isWindowConstrained =
      requiredWindowIds.length > 0 && visitIndex < requiredWindowIds.length;

    // Resolve the display name for this visit's time window (e.g. "Breakfast", "Lunch")
    const visitWindowName: string | undefined = isWindowConstrained
      ? windows.find((w) => w.id === requiredWindowIds[visitIndex])?.name
      : undefined;

    let windowsForAppt: CustomWindowSlot[] = [];

    if (isWindowConstrained) {
      windowsForAppt = customWindows.filter((w) =>
        requiredWindowIds.includes(w.id)
      );
      if (windowsForAppt.length === 0) {
        warnings.push(
          `Appointment "${appt.name}" has required windows that could not be found. Falling back to purpose/day window.`
        );
      }
    }

    if (windowsForAppt.length === 0) {
      if (purposeWindow) {
        windowsForAppt = [
          {
            id: "",
            start: purposeWindow.start,
            end: purposeWindow.end,
            minGapToNext: minGapBase,
          },
        ];
      } else if (!isWindowConstrained && customWindows.length > 0 && requiredWindowIds.length === 0) {
        // Appointment has no windows set at all — use all global custom windows
        windowsForAppt = customWindows;
      } else {
        // Unconstrained extra visit, or no windows at all — use full day
        windowsForAppt = [
          {
            id: "",
            start: dayStartMin,
            end: dayEndMin,
            minGapToNext: minGapBase,
          },
        ];
      }
    }

    const clientVisits = getClientVisits(appt.name);
    const eligibleStaff = staff.filter(
      (s) => staffHasRequiredSkills(s, appt) && staffMatchesGender(s, appt)
    );

    // ── STRICT + MULTI-STAFF: collect all candidates before committing ──
    if (strict !== null && appt.requiredStaff > 1) {
      type Candidate = {
        s: Staff;
        slot: { start: number; end: number };
        minGapToNext: number;
      };
      const candidates: Candidate[] = [];

      for (const s of eligibleStaff) {
        if (candidates.length >= appt.requiredStaff) break;

        const staffDayStart = s.workStart ? Math.max(dayStartMin, toMinutes(s.workStart)) : dayStartMin;
        const staffDayEnd = s.workEnd ? Math.min(dayEndMin, toMinutes(s.workEnd)) : dayEndMin;
        const timeline = staffTimelines.get(s.id) ?? [];
        let found: { slot: { start: number; end: number }; minGapToNext: number } | null = null;

        for (const w of windowsForAppt) {
          const clientMinGap = Math.max(minGapBase, w.minGapToNext || 0);
          const slot = findSlotForVisit(
            s, timeline, duration, staffDayStart, staffDayEnd,
            appt.postcode, strict, { start: w.start, end: w.end },
            0, officePostcode, travelMin,
            clientVisits, clientMinGap
          );
          if (slot) {
            found = { slot, minGapToNext: clientMinGap };
            break;
          }
        }

        if (found) candidates.push({ s, ...found });
      }

      if (candidates.length >= appt.requiredStaff) {
        // All required staff available at the same strict time — commit
        let clientRecorded = false;
        for (const { s, slot, minGapToNext } of candidates.slice(0, appt.requiredStaff)) {
          const timeline = staffTimelines.get(s.id) ?? [];
          timeline.push({ start: slot.start, end: slot.end, postcode: appt.postcode });
          staffTimelines.set(s.id, timeline);
          visits.push(makeISOVisit(baseDate, appt, s, slot.start, slot.end, visitWindowName));

          // Record client visit only once (all candidates share the same slot)
          if (!clientRecorded) {
            recordClientVisit(appt.name, slot.start, slot.end, minGapToNext);
            clientRecorded = true;
          }
        }
      } else {
        warnings.push(
          `Could not fully allocate "${appt.name}" at ${appt.strictStartTime} (${candidates.length}/${appt.requiredStaff} staff available).`
        );
      }

      continue;
    }

    // ── STANDARD ASSIGNMENT (single staff OR non-strict multi-staff) ──
    let assigned = 0;

    for (const s of eligibleStaff) {
      if (assigned >= appt.requiredStaff) break;

      const staffDayStart = s.workStart ? Math.max(dayStartMin, toMinutes(s.workStart)) : dayStartMin;
      const staffDayEnd = s.workEnd ? Math.min(dayEndMin, toMinutes(s.workEnd)) : dayEndMin;
      const timeline = staffTimelines.get(s.id) ?? [];
      let slot: { start: number; end: number } | null = null;
      let usedMinGapToNext = 0;

      for (const w of windowsForAppt) {
        const clientMinGap = Math.max(minGapBase, w.minGapToNext || 0);
        slot = findSlotForVisit(
          s, timeline, duration, staffDayStart, staffDayEnd,
          appt.postcode, strict, { start: w.start, end: w.end },
          0, officePostcode, travelMin,
          clientVisits, clientMinGap
        );
        if (slot) {
          usedMinGapToNext = clientMinGap;
          break;
        }
      }

      if (!slot) continue;

      timeline.push({ start: slot.start, end: slot.end, postcode: appt.postcode });
      staffTimelines.set(s.id, timeline);
      visits.push(makeISOVisit(baseDate, appt, s, slot.start, slot.end, visitWindowName));

      // Record client visit on first staff assignment
      if (assigned === 0) {
        recordClientVisit(appt.name, slot.start, slot.end, usedMinGapToNext);
      }

      assigned++;
    }

    if (assigned < appt.requiredStaff) {
      warnings.push(
        `Could not fully allocate "${appt.name}" (${assigned}/${appt.requiredStaff} staff).`
      );
    }
  }

  // ── GAP HINTS ─────────────────────────────────────────────────────────────
  // Identify staff members who have at least one appointment but also have a
  // gap large enough that another visit could potentially fit.
  const hints: string[] = [];
  const MIN_GAP_HINT = 30; // minutes — smallest meaningful visit duration

  function minsToTimeStr(mins: number): string {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  for (const s of staff) {
    const timeline = (staffTimelines.get(s.id) ?? [])
      .slice()
      .sort((a, b) => a.start - b.start);

    if (timeline.length === 0) continue;

    const staffDayStart = s.workStart ? Math.max(dayStartMin, toMinutes(s.workStart)) : dayStartMin;
    const staffDayEnd = s.workEnd ? Math.min(dayEndMin, toMinutes(s.workEnd)) : dayEndMin;

    const gaps: Array<{ start: number; end: number }> = [];

    const gapBefore = timeline[0].start - staffDayStart;
    if (gapBefore >= MIN_GAP_HINT) gaps.push({ start: staffDayStart, end: timeline[0].start });

    for (let i = 1; i < timeline.length; i++) {
      const gap = timeline[i].start - timeline[i - 1].end;
      if (gap >= MIN_GAP_HINT) gaps.push({ start: timeline[i - 1].end, end: timeline[i].start });
    }

    const gapAfter = staffDayEnd - timeline[timeline.length - 1].end;
    if (gapAfter >= MIN_GAP_HINT) gaps.push({ start: timeline[timeline.length - 1].end, end: staffDayEnd });

    if (gaps.length > 0) {
      const gapList = gaps
        .map((g) => `${minsToTimeStr(g.start)}–${minsToTimeStr(g.end)}`)
        .join(", ");
      hints.push(
        `${s.name} has ${gaps.length} free gap${gaps.length > 1 ? "s" : ""} today that could potentially fit an additional appointment: ${gapList}.`
      );
    }
  }

  return { visits, warnings, hints };
}
