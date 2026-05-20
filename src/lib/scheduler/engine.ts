// C:\Users\matth\georoute\src\lib\scheduler\engine.ts
import { SchedulerContext, SchedulerResult, ScheduledVisit } from "./types";
import { Appointment } from "@/store/appointmentStore";
import { Staff } from "@/store/staffStore";
import { CallPurpose } from "@/store/callPurposeStore";
import { CustomWindow } from "@/store/customWindowStore";

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map((v) => parseInt(v, 10));
  return h * 60 + m;
}

function fromMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// very simple placeholder travel time (minutes)
function estimateTravelMinutes(_fromPostcode: string, _toPostcode: string): number {
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
  officePostcode: string | null
): { start: number; end: number } | null {
  const baseStart = window ? Math.max(dayStart, window.start) : dayStart;
  const baseEnd = window ? Math.min(dayEnd, window.end) : dayEnd;

  const sorted = existing.slice().sort((a, b) => a.start - b.start);

  const candidateStart = (t: number) => {
    if (strictStartMinutes !== null) return strictStartMinutes;
    return t;
  };

  let current = baseStart;

  for (const slot of sorted) {
    const travelBefore = estimateTravelMinutes(slot.postcode, clientPostcode);
    const travelAfter = estimateTravelMinutes(clientPostcode, slot.postcode);

    const earliestStart = candidateStart(current);
    const latestEnd = earliestStart + visitDuration;

    if (
      latestEnd + travelAfter <= slot.start - minGapMinutes &&
      earliestStart - travelBefore >= baseStart
    ) {
      if (earliestStart >= baseStart && latestEnd <= baseEnd) {
        return { start: earliestStart, end: latestEnd };
      }
    }

    current = Math.max(current, slot.end + minGapMinutes);
  }

  const originPostcode = staff.officePostcode || officePostcode || "";
  const travelFromOffice = estimateTravelMinutes(originPostcode, clientPostcode);
  const start = candidateStart(current + travelFromOffice);
  const end = start + visitDuration;

  if (start >= baseStart && end <= baseEnd) {
    return { start, end };
  }

  return null;
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
  } = ctx;

  const warnings: string[] = [];
  const visits: ScheduledVisit[] = [];

  const dayStartMin = toMinutes(dayStart);
  const dayEndMin = toMinutes(dayEnd);

  const staffTimelines = new Map<string, StaffTimelineSlot[]>();
  staff.forEach((s) => staffTimelines.set(s.id, []));

  const customWindows = getCustomWindows(windows);

  // Expand multi-visit appointments
  const expanded: Appointment[] = [];
  for (const appt of appointments.filter((a) => !a.archived)) {
    const count = Math.max(1, appt.visitsRequired || 1);
    for (let i = 0; i < count; i++) {
      expanded.push(appt);
    }
  }

  // Sort by strict time first, then by purpose/custom window start, then by day start
  const expandedSorted = expanded.slice().sort((a, b) => {
    const aStrict = a.strictStartTime ? toMinutes(a.strictStartTime) : null;
    const bStrict = b.strictStartTime ? toMinutes(b.strictStartTime) : null;

    const aWindow = getPurposeWindow(a, purposes);
    const bWindow = getPurposeWindow(b, purposes);

    const aKey = aStrict ?? aWindow?.start ?? dayStartMin;
    const bKey = bStrict ?? bWindow?.start ?? dayStartMin;

    return aKey - bKey;
  });

  for (const appt of expandedSorted) {
    const duration = appt.durationMinutes || 30;
    const minGapBase = appt.minGapMinutes ?? 120;
    const strict = appt.strictStartTime ? toMinutes(appt.strictStartTime) : null;
    const purposeWindow = getPurposeWindow(appt, purposes);

    let windowsForAppt: { start: number; end: number; minGapToNext: number }[] =
      [];

    const requiredWindowIds = appt.requiredWindows ?? [];

    if (requiredWindowIds.length > 0) {
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
            start: purposeWindow.start,
            end: purposeWindow.end,
            minGapToNext: minGapBase,
          },
        ];
      } else if (customWindows.length > 0) {
        windowsForAppt = customWindows;
      } else {
        windowsForAppt = [
          {
            start: dayStartMin,
            end: dayEndMin,
            minGapToNext: minGapBase,
          },
        ];
      }
    }

    let assigned = 0;
    const sortedStaff = staff.slice();

    for (const s of sortedStaff) {
      if (assigned >= appt.requiredStaff) break;

      if (!staffHasRequiredSkills(s, appt)) continue;
      if (!staffMatchesGender(s, appt)) continue;

      const timeline = staffTimelines.get(s.id) || [];
      let slot: { start: number; end: number } | null = null;

      for (const w of windowsForAppt) {
        const effectiveMinGap = Math.max(minGapBase, w.minGapToNext || 0);

        slot = findSlotForVisit(
          s,
          timeline,
          duration,
          dayStartMin,
          dayEndMin,
          appt.postcode,
          strict,
          { start: w.start, end: w.end },
          effectiveMinGap,
          officePostcode
        );

        if (slot) break;
      }

      if (!slot) continue;

      const startTime = slot.start;
      const endTime = slot.end;

      timeline.push({
        start: startTime,
        end: endTime,
        postcode: appt.postcode,
      });
      staffTimelines.set(s.id, timeline);

      const today = new Date();
      const baseDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        0,
        0,
        0,
        0
      );

      const startDate = new Date(baseDate.getTime() + startTime * 60 * 1000);
      const endDate = new Date(baseDate.getTime() + endTime * 60 * 1000);

      visits.push({
        id: crypto.randomUUID(),
        appointmentId: appt.id,
        staffId: s.id,
        clientName: appt.name,
        staffName: s.name,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        postcode: appt.postcode,
      });

      assigned++;
    }

    if (assigned < appt.requiredStaff) {
      warnings.push(
        `Could not fully allocate "${appt.name}" (${assigned}/${appt.requiredStaff} staff).`
      );
    }
  }

  return { visits, warnings };
}
