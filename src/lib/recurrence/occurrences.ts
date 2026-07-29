// Which dates a recurring appointment actually falls on.
//
// Everything here works in plain "YYYY-MM-DD" strings and UTC-noon Dates.
// Using local midnight would put BST dates an hour before the day boundary,
// and a date that shifts by an hour lands on the wrong day roughly twice a
// year -- which is exactly the kind of bug that only shows up in October.

export type RecurFreq = "once" | "daily" | "weekly";

export interface RecurrenceRule {
  freq: RecurFreq;
  /** Every N days or weeks. 1 = every one. */
  interval: number;
  /** ISO weekdays, 1 = Monday .. 7 = Sunday. Only used when freq is weekly. */
  weekdays: number[];
  /** "YYYY-MM-DD". */
  startsOn: string;
  /** "YYYY-MM-DD", or null for open ended. */
  endsOn?: string | null;
}

export interface RecurrenceException {
  /** The date in the series being altered, "YYYY-MM-DD". */
  onDate: string;
  action: "skip" | "move";
  /** Where it went, when action is "move". */
  movedToDate?: string | null;
}

/** Noon UTC, so a date can never drift across a day boundary. */
function toDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

export function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** ISO weekday: 1 = Monday .. 7 = Sunday. */
export function isoWeekday(d: Date): number {
  const js = d.getUTCDay(); // 0 = Sunday
  return js === 0 ? 7 : js;
}

function addDays(d: Date, n: number): Date {
  const out = new Date(d.getTime());
  out.setUTCDate(out.getUTCDate() + n);
  return out;
}

/** Whole days between two dates, ignoring time. */
function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

/**
 * Monday of the week containing d. Weeks start Monday so that an
 * every-N-weeks interval counts the same way a rota does.
 */
function weekStart(d: Date): Date {
  return addDays(d, -(isoWeekday(d) - 1));
}

/** Does this rule, ignoring exceptions, land on the given date? */
export function ruleMatchesDate(rule: RecurrenceRule, iso: string): boolean {
  const date = toDate(iso);
  const start = toDate(rule.startsOn);

  if (date.getTime() < start.getTime()) return false;
  if (rule.endsOn && date.getTime() > toDate(rule.endsOn).getTime()) return false;

  const interval = Math.max(1, Math.trunc(rule.interval || 1));

  if (rule.freq === "once") {
    return iso === rule.startsOn;
  }

  if (rule.freq === "daily") {
    return daysBetween(start, date) % interval === 0;
  }

  // weekly
  const days = rule.weekdays ?? [];
  // No weekday chosen behaves as "the same weekday it started on", which is
  // what someone means by "weekly" before they touch the day checkboxes.
  const wanted = days.length > 0 ? days : [isoWeekday(start)];
  if (!wanted.includes(isoWeekday(date))) return false;

  const weeksApart = Math.round(
    daysBetween(weekStart(start), weekStart(date)) / 7
  );
  return weeksApart % interval === 0;
}

/**
 * Dates this appointment should be visited on, within [fromIso, toIso].
 *
 * Exceptions are applied after expansion: a skip removes a date, and a move
 * removes it and adds the new one. A moved-to date is included even when the
 * rule would not otherwise produce it, which is the whole point of a move.
 */
export function occurrencesBetween(
  rule: RecurrenceRule,
  exceptions: RecurrenceException[],
  fromIso: string,
  toIso: string
): string[] {
  const from = toDate(fromIso);
  const to = toDate(toIso);
  if (to.getTime() < from.getTime()) return [];

  const skipped = new Set<string>();
  const moved = new Map<string, string>();

  for (const ex of exceptions) {
    if (ex.action === "skip") {
      skipped.add(ex.onDate);
    } else if (ex.action === "move" && ex.movedToDate) {
      moved.set(ex.onDate, ex.movedToDate);
    }
  }

  const out = new Set<string>();

  for (let d = from; d.getTime() <= to.getTime(); d = addDays(d, 1)) {
    const iso = toIsoDate(d);
    if (!ruleMatchesDate(rule, iso)) continue;
    if (skipped.has(iso)) continue;

    const movedTo = moved.get(iso);
    if (movedTo) {
      // Only surface the move if it lands inside the range being asked about.
      if (movedTo >= fromIso && movedTo <= toIso) out.add(movedTo);
      continue;
    }

    out.add(iso);
  }

  // A visit moved INTO this range from an occurrence outside it would
  // otherwise be missed, since the loop above never visits its original date.
  for (const [onDate, movedTo] of moved) {
    if (movedTo < fromIso || movedTo > toIso) continue;
    if (onDate >= fromIso && onDate <= toIso) continue; // already handled
    if (ruleMatchesDate(rule, onDate)) out.add(movedTo);
  }

  return [...out].sort();
}

/** Convenience for the scheduler: does this appointment fall on one date? */
export function occursOn(
  rule: RecurrenceRule,
  exceptions: RecurrenceException[],
  iso: string
): boolean {
  return occurrencesBetween(rule, exceptions, iso, iso).length > 0;
}
