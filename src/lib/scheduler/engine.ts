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

function getCustomWindows(
  windows: CustomWindow[]
): { start: number; end: number; minGapToNext: number }[] {
  return windows
    .slice()
    .sort((a, b) => toMinutes(a.start) - toMinutes(b.start))
    .map((w) => ({
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

function findSlotForVisit(
  staff: Staff,
  existing: StaffTimelineSlot[],
  visitDuration: number,
  dayStart: number,
  dayEnd: number,
  clientPostcode: string,
  strictStartMinutes: number | null,
  window: { start: number; end: number } | null,
  minGapMinutes: number
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
    const travelBefore = estimateTravelMinutes(
      slot.postcode,
      clientPostcode
    );
    const travelAfter = estimateTravelMinutes(
      clientPostcode,
      slot.postcode
    );

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

  const travelFromOffice = estimateTravelMinutes(
    staff.officePostcode || "",
    clientPostcode
  );
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
  } = ctx;

  const warnings: string[] = [];
  const visits: ScheduledVisit[] = [];

  const dayStartMin = toMinutes(dayStart);
  const dayEndMin = toMinutes(dayEnd);

  const staffTimelines = new Map<string, StaffTimelineSlot[]>();
  staff.forEach((s) => staffTimelines.set(s.id, []));

  const customWindows = getCustomWindows(windows);

  const expanded: Appointment[] = [];
  for (const appt of appointments.filter((a) => !a.archived)) {
    const count = Math.max(1, appt.visitsRequired || 1);
    for (let i = 0; i < count; i++) {
      expanded.push(appt);
    }
  }

  for (const appt of expanded) {
    const duration = appt.durationMinutes || 30;
    const minGap = appt.minGapMinutes ?? 120;
    const strict = appt.strictStartTime
      ? toMinutes(appt.strictStartTime)
      : null;
    const purposeWindow = getPurposeWindow(appt, purposes);

    const windowToUse =
      purposeWindow ||
      (customWindows.length > 0 ? customWindows[0] : null);

    let assigned = 0;

    const sortedStaff = staff.slice();

    for (const s of sortedStaff) {
      if (assigned >= appt.requiredStaff) break;

      const timeline = staffTimelines.get(s.id) || [];
      const slot = findSlotForVisit(
        s,
        timeline,
        duration,
        dayStartMin,
        dayEndMin,
        appt.postcode,
        strict,
        windowToUse,
        minGap
      );

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
