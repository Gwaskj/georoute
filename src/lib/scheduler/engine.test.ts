import { describe, it, expect } from "vitest";
import { runScheduler } from "./engine";
import {
  staff,
  appointment,
  context,
  travel,
  minutesOf,
  hhmm,
} from "./testFixtures";

/**
 * Tests for the scheduling engine.
 *
 * This is the part of the product customers actually pay for, and until now it
 * had no tests at all -- two real bugs shipped through it and were only found
 * by chance: repeat visits being silently dropped, and visits going to the
 * first eligible staff member rather than the nearest. Both are asserted here.
 *
 * The engine has no notion of free or Pro; plan limits are enforced above it.
 * What differs is the shape of the input, so both are exercised as scale: a
 * free-tier round of 2 staff and 10 appointments, and a Pro-sized one of 8
 * staff and 60 visits including repeats and double-ups.
 */

const MIN = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

describe("basic assignment", () => {
  it("schedules a single visit for a single carer", () => {
    const r = runScheduler(
      context({
        staff: [staff({ id: "s1", name: "Ann" })],
        appointments: [appointment({ id: "a1", name: "Mrs Patel" })],
      })
    );

    expect(r.visits).toHaveLength(1);
    expect(r.visits[0].staffName).toBe("Ann");
    expect(r.visits[0].clientName).toBe("Mrs Patel");
    expect(r.warnings).toEqual([]);
  });

  it("leaves nothing unscheduled when there is ample capacity", () => {
    const r = runScheduler(
      context({
        staff: [staff({ id: "s1" }), staff({ id: "s2" })],
        appointments: Array.from({ length: 6 }, (_, i) =>
          appointment({ id: `a${i}`, name: `Client ${i}` })
        ),
      })
    );

    expect(r.visits).toHaveLength(6);
    expect(r.warnings).toEqual([]);
  });

  it("starts the first visit after travel from the carer's start point", () => {
    const r = runScheduler(
      context({
        staff: [staff({ id: "s1", homePostcode: "AA1 1AA", workStart: "09:00" })],
        appointments: [appointment({ id: "a1", postcode: "BB2 2BB" })],
        getTravelMinutes: travel({ "AA1 1AA->BB2 2BB": 25 }),
      })
    );

    // 09:00 start + 25 minutes of driving, rounded to the next 5.
    expect(hhmm(minutesOf(r.visits[0].start))).toBe("09:25");
  });

  it("returns nothing, and does not throw, with no staff or no appointments", () => {
    expect(
      runScheduler(context({ staff: [], appointments: [appointment()] })).visits
    ).toHaveLength(0);
    expect(
      runScheduler(context({ staff: [staff()], appointments: [] })).visits
    ).toHaveLength(0);
  });
});

describe("repeat visits to the same person", () => {
  it("creates one visit per visitsRequired", () => {
    const r = runScheduler(
      context({
        staff: [staff({ id: "s1" })],
        appointments: [
          appointment({ id: "a1", visitsRequired: 4, minGapMinutes: 120 }),
        ],
      })
    );

    // The regression this guards: repeat visits were silently dropped because
    // only one candidate start time was tried per visit.
    expect(r.visits).toHaveLength(4);
  });

  it("keeps at least the minimum gap between consecutive visits", () => {
    const gap = 180;
    const r = runScheduler(
      context({
        staff: [staff({ id: "s1", workStart: "07:00", workEnd: "22:00" })],
        appointments: [
          appointment({ id: "a1", visitsRequired: 4, minGapMinutes: gap, durationMinutes: 30 }),
        ],
        dayStart: "07:00",
        dayEnd: "22:00",
      })
    );

    expect(r.visits).toHaveLength(4);

    const starts = r.visits
      .map((v) => minutesOf(v.start))
      .sort((a, b) => a - b);

    for (let i = 1; i < starts.length; i++) {
      const actual = starts[i] - starts[i - 1];
      expect(
        actual,
        `visits ${i - 1}->${i} were ${actual} min apart (${hhmm(starts[i - 1])} then ${hhmm(starts[i])}), minimum is ${gap}`
      ).toBeGreaterThanOrEqual(gap);
    }
  });

  it("treats visitsRequired of 1 as an ordinary single appointment", () => {
    const r = runScheduler(
      context({
        staff: [staff({ id: "s1" })],
        appointments: [appointment({ id: "a1", visitsRequired: 1, minGapMinutes: 240 })],
      })
    );

    expect(r.visits).toHaveLength(1);
  });

  it("interleaves a repeat-visit client with single-visit clients", () => {
    const r = runScheduler(
      context({
        staff: [staff({ id: "s1", workStart: "07:00", workEnd: "22:00" })],
        appointments: [
          appointment({ id: "repeat", name: "Four calls", visitsRequired: 4, minGapMinutes: 150 }),
          appointment({ id: "one", name: "Single A" }),
          appointment({ id: "two", name: "Single B" }),
        ],
        dayStart: "07:00",
        dayEnd: "22:00",
      })
    );

    expect(r.visits.filter((v) => v.appointmentId === "repeat")).toHaveLength(4);
    expect(r.visits.filter((v) => v.appointmentId === "one")).toHaveLength(1);
    expect(r.visits.filter((v) => v.appointmentId === "two")).toHaveLength(1);
  });
});

describe("choosing which carer goes", () => {
  it("sends the nearest carer, not merely the first eligible one", () => {
    const r = runScheduler(
      context({
        staff: [
          staff({ id: "far", name: "Far", homePostcode: "FAR" }),
          staff({ id: "near", name: "Near", homePostcode: "NEAR" }),
        ],
        appointments: [appointment({ id: "a1", postcode: "TARGET" })],
        getTravelMinutes: travel({ "FAR->TARGET": 60, "NEAR->TARGET": 5 }),
      })
    );

    // The regression this guards: assignment took the first staff member who
    // could fit rather than costing all of them, so the listing order decided
    // the round rather than the geography.
    expect(r.visits[0].staffName).toBe("Near");
  });

  it("spreads work rather than loading one carer when travel is equal", () => {
    const r = runScheduler(
      context({
        staff: [staff({ id: "s1", name: "A" }), staff({ id: "s2", name: "B" })],
        appointments: Array.from({ length: 8 }, (_, i) =>
          appointment({ id: `a${i}`, postcode: `PC${i}` })
        ),
      })
    );

    const perStaff = new Map<string, number>();
    for (const v of r.visits) {
      perStaff.set(v.staffName, (perStaff.get(v.staffName) ?? 0) + 1);
    }

    expect(r.visits).toHaveLength(8);
    for (const [name, count] of perStaff) {
      expect(count, `${name} took ${count} of 8 visits`).toBeLessThan(8);
    }
  });
});

describe("skills", () => {
  it("only sends a visit to a carer holding the required skill", () => {
    const r = runScheduler(
      context({
        staff: [
          staff({ id: "unskilled", name: "Unskilled", skills: [] }),
          staff({ id: "skilled", name: "Skilled", skills: ["insulin"] }),
        ],
        appointments: [appointment({ id: "a1", requiredSkills: ["insulin"] })],
      })
    );

    expect(r.visits).toHaveLength(1);
    expect(r.visits[0].staffName).toBe("Skilled");
  });

  it("warns rather than silently dropping a visit no one is qualified for", () => {
    const r = runScheduler(
      context({
        staff: [staff({ id: "s1", name: "Ann", skills: [] })],
        appointments: [
          appointment({ id: "a1", name: "Needs syringe driver", requiredSkills: ["syringe-driver"] }),
        ],
      })
    );

    expect(r.visits).toHaveLength(0);
    expect(r.warnings.length).toBeGreaterThan(0);
    expect(r.warnings.join(" ")).toContain("Needs syringe driver");
  });
});

describe("double-up visits", () => {
  it("sends two carers to the same address at the same time", () => {
    const r = runScheduler(
      context({
        staff: [staff({ id: "s1", name: "A" }), staff({ id: "s2", name: "B" })],
        appointments: [appointment({ id: "a1", requiredStaff: 2 })],
      })
    );

    const forAppt = r.visits.filter((v) => v.appointmentId === "a1");
    expect(forAppt).toHaveLength(2);
    expect(new Set(forAppt.map((v) => v.staffName)).size).toBe(2);
    expect(forAppt[0].start).toBe(forAppt[1].start);
  });

  it("warns when a double-up cannot be staffed", () => {
    const r = runScheduler(
      context({
        staff: [staff({ id: "s1" })],
        appointments: [appointment({ id: "a1", name: "Needs two", requiredStaff: 2 })],
      })
    );

    expect(r.visits.filter((v) => v.appointmentId === "a1")).toHaveLength(0);
    expect(r.warnings.join(" ")).toContain("Needs two");
  });
});

describe("times and working hours", () => {
  it("honours a strict start time exactly", () => {
    const r = runScheduler(
      context({
        staff: [staff({ id: "s1" })],
        appointments: [appointment({ id: "a1", strictStartTime: "14:30" })],
      })
    );

    expect(hhmm(minutesOf(r.visits[0].start))).toBe("14:30");
  });

  it("never schedules outside a carer's working hours", () => {
    const r = runScheduler(
      context({
        staff: [staff({ id: "s1", workStart: "09:00", workEnd: "13:00" })],
        appointments: Array.from({ length: 5 }, (_, i) =>
          appointment({ id: `a${i}`, durationMinutes: 30 })
        ),
        dayStart: "07:00",
        dayEnd: "20:00",
      })
    );

    for (const v of r.visits) {
      expect(minutesOf(v.start)).toBeGreaterThanOrEqual(MIN("09:00"));
      expect(
        minutesOf(v.end),
        `${v.clientName} ended at ${hhmm(minutesOf(v.end))}, after the 13:00 finish`
      ).toBeLessThanOrEqual(MIN("13:00"));
    }
  });

  it("never double-books a carer", () => {
    const r = runScheduler(
      context({
        staff: [staff({ id: "s1" }), staff({ id: "s2" })],
        appointments: Array.from({ length: 12 }, (_, i) =>
          appointment({ id: `a${i}`, durationMinutes: 30 })
        ),
      })
    );

    const byStaff = new Map<string, { s: number; e: number; who: string }[]>();
    for (const v of r.visits) {
      const list = byStaff.get(v.staffId) ?? [];
      list.push({ s: minutesOf(v.start), e: minutesOf(v.end), who: v.clientName });
      byStaff.set(v.staffId, list);
    }

    for (const [id, list] of byStaff) {
      list.sort((a, b) => a.s - b.s);
      for (let i = 1; i < list.length; i++) {
        expect(
          list[i].s,
          `${id}: ${list[i - 1].who} runs to ${hhmm(list[i - 1].e)} but ${list[i].who} starts ${hhmm(list[i].s)}`
        ).toBeGreaterThanOrEqual(list[i - 1].e);
      }
    }
  });
});

describe("breaks", () => {
  it("reserves a break and keeps visits clear of it", () => {
    const r = runScheduler(
      context({
        staff: [
          staff({
            id: "s1",
            workStart: "08:00",
            workEnd: "17:00",
            breaks: [{ id: "b1", minutes: 30, windowStart: "12:00", windowEnd: "14:00" }],
          }),
        ],
        appointments: Array.from({ length: 8 }, (_, i) =>
          appointment({ id: `a${i}`, durationMinutes: 30 })
        ),
      })
    );

    expect(r.breaks.length).toBeGreaterThan(0);

    const br = r.breaks[0];
    const bs = minutesOf(br.start);
    const be = minutesOf(br.end);

    expect(be - bs).toBe(30);
    expect(bs).toBeGreaterThanOrEqual(MIN("12:00"));
    expect(be).toBeLessThanOrEqual(MIN("14:00"));

    for (const v of r.visits.filter((v) => v.staffId === "s1")) {
      const vs = minutesOf(v.start);
      const ve = minutesOf(v.end);
      const overlaps = vs < be && ve > bs;
      expect(
        overlaps,
        `${v.clientName} (${hhmm(vs)}-${hhmm(ve)}) overlaps the break (${hhmm(bs)}-${hhmm(be)})`
      ).toBe(false);
    }
  });

  it("supports more than one break in a day", () => {
    const r = runScheduler(
      context({
        staff: [
          staff({
            id: "s1",
            workStart: "07:00",
            workEnd: "20:00",
            breaks: [
              { id: "b1", minutes: 20, windowStart: "10:00", windowEnd: "11:00" },
              { id: "b2", minutes: 40, windowStart: "14:00", windowEnd: "16:00" },
            ],
          }),
        ],
        appointments: Array.from({ length: 6 }, (_, i) => appointment({ id: `a${i}` })),
        dayStart: "07:00",
        dayEnd: "20:00",
      })
    );

    expect(r.breaks).toHaveLength(2);
    expect(r.breaks.map((b) => minutesOf(b.end) - minutesOf(b.start)).sort((a, b) => a - b))
      .toEqual([20, 40]);
  });
});

describe("capacity", () => {
  it("warns by name rather than dropping visits it cannot fit", () => {
    const r = runScheduler(
      context({
        staff: [staff({ id: "s1", workStart: "09:00", workEnd: "11:00" })],
        appointments: Array.from({ length: 20 }, (_, i) =>
          appointment({ id: `a${i}`, name: `Client ${i}`, durationMinutes: 60 })
        ),
        dayStart: "09:00",
        dayEnd: "11:00",
      })
    );

    const placed = r.visits.length;
    expect(placed).toBeLessThan(20);
    expect(
      r.warnings.length,
      `${20 - placed} visits did not fit but produced ${r.warnings.length} warnings`
    ).toBeGreaterThan(0);
  });
});

describe("free-tier sized round", () => {
  it("schedules 2 carers and 10 appointments without warnings", () => {
    const r = runScheduler(
      context({
        staff: [
          staff({ id: "s1", name: "Ann", homePostcode: "LS1 1UR" }),
          staff({ id: "s2", name: "Ben", homePostcode: "LS2 8JS" }),
        ],
        appointments: Array.from({ length: 10 }, (_, i) =>
          appointment({ id: `a${i}`, name: `Client ${i}`, postcode: `LS${i} 1AA`, durationMinutes: 30 })
        ),
      })
    );

    expect(r.visits).toHaveLength(10);
    expect(r.warnings).toEqual([]);
  });
});

describe("pro-sized round", () => {
  it("handles 8 carers and a mixed 60-visit caseload", () => {
    const appointments = [
      // Four clients on four calls a day, spaced -- the case the product exists for.
      ...Array.from({ length: 4 }, (_, i) =>
        appointment({
          id: `repeat-${i}`,
          name: `Repeat ${i}`,
          postcode: `RP${i}`,
          visitsRequired: 4,
          minGapMinutes: 150,
          durationMinutes: 30,
        })
      ),
      // Four double-ups.
      ...Array.from({ length: 4 }, (_, i) =>
        appointment({ id: `double-${i}`, name: `Double ${i}`, postcode: `DB${i}`, requiredStaff: 2 })
      ),
      // The rest ordinary single visits.
      ...Array.from({ length: 36 }, (_, i) =>
        appointment({ id: `single-${i}`, name: `Single ${i}`, postcode: `SG${i}` })
      ),
    ];

    const started = Date.now();
    const r = runScheduler(
      context({
        staff: Array.from({ length: 8 }, (_, i) =>
          staff({ id: `s${i}`, name: `Carer ${i}`, homePostcode: `HM${i}`, workStart: "07:00", workEnd: "22:00" })
        ),
        appointments,
        dayStart: "07:00",
        dayEnd: "22:00",
      })
    );
    const elapsed = Date.now() - started;

    // 4 repeats x 4 calls + 4 double-ups x 2 carers + 36 singles = 60 visits.
    expect(r.visits).toHaveLength(60);
    expect(r.warnings).toEqual([]);

    // Runs in the browser on a click, so it has to stay interactive.
    expect(elapsed, `took ${elapsed}ms`).toBeLessThan(3000);
  });

  it("keeps every carer's day internally consistent at scale", () => {
    const r = runScheduler(
      context({
        staff: Array.from({ length: 6 }, (_, i) =>
          staff({ id: `s${i}`, workStart: "08:00", workEnd: "18:00" })
        ),
        appointments: Array.from({ length: 40 }, (_, i) =>
          appointment({ id: `a${i}`, name: `C${i}`, postcode: `P${i}` })
        ),
      })
    );

    const byStaff = new Map<string, { s: number; e: number }[]>();
    for (const v of r.visits) {
      const l = byStaff.get(v.staffId) ?? [];
      l.push({ s: minutesOf(v.start), e: minutesOf(v.end) });
      byStaff.set(v.staffId, l);
    }

    for (const [, list] of byStaff) {
      list.sort((a, b) => a.s - b.s);
      for (let i = 1; i < list.length; i++) {
        expect(list[i].s).toBeGreaterThanOrEqual(list[i - 1].e);
      }
      for (const slot of list) {
        expect(slot.s).toBeGreaterThanOrEqual(MIN("08:00"));
        expect(slot.e).toBeLessThanOrEqual(MIN("18:00"));
      }
    }
  });
});

describe("determinism", () => {
  it("produces the same plan for the same input", () => {
    const build = () =>
      context({
        staff: [
          staff({ id: "s1", name: "A", homePostcode: "H1" }),
          staff({ id: "s2", name: "B", homePostcode: "H2" }),
        ],
        appointments: Array.from({ length: 10 }, (_, i) =>
          appointment({ id: `a${i}`, name: `C${i}`, postcode: `P${i}` })
        ),
        getTravelMinutes: travel({}, 12),
      });

    const shape = (r: ReturnType<typeof runScheduler>) =>
      r.visits
        .map((v) => `${v.appointmentId}@${v.staffId}@${minutesOf(v.start)}`)
        .sort()
        .join("|");

    // Identical inputs must not produce different rounds on different runs;
    // a carer's day changing between two clicks would be indefensible.
    expect(shape(runScheduler(build()))).toBe(shape(runScheduler(build())));
  });
});

describe("the day being planned", () => {
  it("dates visits on the planning day, not on today", () => {
    // Far enough from today that a timezone slip could not coincidentally pass.
    const planningDate = "2027-03-09";
    const r = runScheduler(
      context({
        planningDate,
        staff: [staff({ id: "s1" })],
        appointments: [appointment({ id: "a1" })],
      })
    );

    expect(r.visits).toHaveLength(1);
    const d = new Date(r.visits[0].start);
    const actual = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    // The regression this guards: the engine built every timestamp from
    // new Date(), so a round planned for a future day was stamped with the
    // day it happened to be generated on -- wrong in scheduled_visits, and
    // wrong on the link staff are sent.
    expect(actual, `visit was dated ${actual}, expected ${planningDate}`).toBe(planningDate);
  });

  it("still uses today when no planning day is given", () => {
    const r = runScheduler(
      context({ staff: [staff({ id: "s1" })], appointments: [appointment({ id: "a1" })] })
    );
    const d = new Date(r.visits[0].start);
    const today = new Date();
    expect(d.getDate()).toBe(today.getDate());
    expect(d.getMonth()).toBe(today.getMonth());
  });

  it("dates reserved breaks on the planning day too", () => {
    const planningDate = "2027-03-09";
    const r = runScheduler(
      context({
        planningDate,
        staff: [staff({ id: "s1", breaks: [{ id: "b", minutes: 30, windowStart: "12:00", windowEnd: "14:00" }] })],
        appointments: Array.from({ length: 4 }, (_, i) => appointment({ id: `a${i}` })),
      })
    );
    expect(r.breaks.length).toBeGreaterThan(0);
    const d = new Date(r.breaks[0].start);
    expect(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`)
      .toBe(planningDate);
  });
});
