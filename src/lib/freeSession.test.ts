import { describe, it, expect, beforeEach, vi } from "vitest";
import "fake-indexeddb/auto";
import { IDBFactory } from "fake-indexeddb";

import type { Staff } from "@/store/staffStore";
import type { Appointment } from "@/store/appointmentStore";

/**
 * Tests for the only copy of the user's data.
 *
 * Nothing is held server-side any more, so a bug in this file is not a stale
 * cache -- it is a care provider losing tomorrow's rounds with no way to get
 * them back. That is the reason these go further than a round trip.
 */

/** sessionStorage and localStorage do not exist under the node environment. */
function stubWebStorage() {
  const make = () => {
    const map = new Map<string, string>();
    return {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => void map.set(k, String(v)),
      removeItem: (k: string) => void map.delete(k),
      clear: () => map.clear(),
      key: (i: number) => [...map.keys()][i] ?? null,
      get length() {
        return map.size;
      },
    } as Storage;
  };
  vi.stubGlobal("sessionStorage", make());
  vi.stubGlobal("localStorage", make());
}

/**
 * A fresh module, with fresh module-level state.
 *
 * The cached database handle, the write chain and the migrated-once flag all
 * live at module scope, so tests that share an instance would leak state into
 * each other and hide exactly the ordering bugs this suite exists to catch.
 */
async function freshModule() {
  vi.resetModules();
  vi.stubGlobal("indexedDB", new IDBFactory());
  return import("@/lib/freeSession");
}

const staff = (name: string) => ({ id: name, name }) as unknown as Staff;
const appt = (name: string) => ({ id: name, name }) as unknown as Appointment;

beforeEach(() => {
  vi.unstubAllGlobals();
  stubWebStorage();
});

describe("local scheduler storage", () => {
  it("returns empty data when nothing has been stored", async () => {
    const s = await freshModule();
    const data = await s.loadFreeSchedulerData();

    expect(data?.staff).toEqual([]);
    expect(data?.appointments).toEqual([]);
    expect(data?.officePostcode).toBe("");
  });

  it("round trips a save through IndexedDB", async () => {
    const s = await freshModule();

    await s.saveFreeSchedulerData({
      ...(await s.loadFreeSchedulerData())!,
      staff: [staff("Priya")],
      officePostcode: "LS1 1UR",
    });

    const read = await s.loadFreeSchedulerData();
    expect(read?.staff.map((x) => x.name)).toEqual(["Priya"]);
    expect(read?.officePostcode).toBe("LS1 1UR");
  });

  it("survives a page reload", async () => {
    const first = await freshModule();
    await first.saveFreeSchedulerData({
      ...(await first.loadFreeSchedulerData())!,
      staff: [staff("Priya")],
    });

    // Re-import without resetting the IDBFactory: same database, new module
    // state, which is what a refresh actually does.
    vi.resetModules();
    const second = await import("@/lib/freeSession");

    const read = await second.loadFreeSchedulerData();
    expect(read?.staff.map((x) => x.name)).toEqual(["Priya"]);
  });

  it("keeps both slices when two stores save at once", async () => {
    const s = await freshModule();

    // Exactly what happens when adding a staff member and an appointment in
    // the same tick: each store owns one slice but writes the whole record.
    await Promise.all([
      s.updateSchedulerData((d) => ({ ...d, staff: [...d.staff, staff("Priya")] })),
      s.updateSchedulerData((d) => ({
        ...d,
        appointments: [...d.appointments, appt("Margaret")],
      })),
    ]);

    const read = await s.loadFreeSchedulerData();
    expect(read?.staff.map((x) => x.name)).toEqual(["Priya"]);
    expect(read?.appointments.map((x) => x.name)).toEqual(["Margaret"]);
  });

  it("applies every concurrent update rather than last-write-wins", async () => {
    const s = await freshModule();

    await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        s.updateSchedulerData((d) => ({ ...d, staff: [...d.staff, staff(`c${i}`)] }))
      )
    );

    const read = await s.loadFreeSchedulerData();
    expect(read?.staff).toHaveLength(20);
  });

  it("adopts data left in sessionStorage by the previous version", async () => {
    sessionStorage.setItem(
      "free_scheduler_data",
      JSON.stringify({ staff: [staff("Priya")], appointments: [], routes: [] })
    );

    const s = await freshModule();
    const read = await s.loadFreeSchedulerData();

    expect(read?.staff.map((x) => x.name)).toEqual(["Priya"]);
    // Claimed, so a later reload cannot resurrect it over newer edits.
    expect(sessionStorage.getItem("free_scheduler_data")).toBeNull();
  });

  it("does not let the legacy copy overwrite newer data", async () => {
    const s = await freshModule();
    await s.saveFreeSchedulerData({
      ...(await s.loadFreeSchedulerData())!,
      staff: [staff("Current")],
    });

    sessionStorage.setItem(
      "free_scheduler_data",
      JSON.stringify({ staff: [staff("Stale")], appointments: [], routes: [] })
    );

    const read = await s.loadFreeSchedulerData();
    expect(read?.staff.map((x) => x.name)).toEqual(["Current"]);
  });

  it("falls back to localStorage when IndexedDB is unavailable", async () => {
    vi.resetModules();
    vi.stubGlobal("indexedDB", undefined);
    const s = await import("@/lib/freeSession");

    await s.saveFreeSchedulerData({
      ...(await s.loadFreeSchedulerData())!,
      staff: [staff("Priya")],
    });

    expect(localStorage.getItem("free_scheduler_data")).toContain("Priya");
    const read = await s.loadFreeSchedulerData();
    expect(read?.staff.map((x) => x.name)).toEqual(["Priya"]);
  });

  it("exports and re-imports onto a clean machine", async () => {
    const source = await freshModule();
    await source.saveFreeSchedulerData({
      ...(await source.loadFreeSchedulerData())!,
      staff: [staff("Priya")],
      appointments: [appt("Margaret")],
      officePostcode: "LS1 1UR",
    });
    const backup = await source.exportSchedulerData();

    // A different browser on a different machine.
    const target = await freshModule();
    expect((await target.loadFreeSchedulerData())?.staff).toEqual([]);

    await target.importSchedulerData(backup);

    const read = await target.loadFreeSchedulerData();
    expect(read?.staff.map((x) => x.name)).toEqual(["Priya"]);
    expect(read?.appointments.map((x) => x.name)).toEqual(["Margaret"]);
    expect(read?.officePostcode).toBe("LS1 1UR");
  });

  it("imports a bare record as well as a wrapped export", async () => {
    const s = await freshModule();
    await s.importSchedulerData(JSON.stringify({ staff: [staff("Priya")] }));

    const read = await s.loadFreeSchedulerData();
    expect(read?.staff.map((x) => x.name)).toEqual(["Priya"]);
    // Absent fields still arrive as usable empties.
    expect(read?.appointments).toEqual([]);
  });

  it("carries the office settings through an export", async () => {
    // The office postcode used to live in business_settings on the server. A
    // backup that restored the rounds but not the office they start from
    // would send every carer out from nowhere.
    const source = await freshModule();
    await source.updateSchedulerData((d) => ({
      ...d,
      staff: [staff("Priya")],
      settings: { officePostcode: "LS1 1UR", dayStart: "07:00", dayEnd: "21:00", country: "GB" },
    }));
    const backup = await source.exportSchedulerData();

    const target = await freshModule();
    await target.importSchedulerData(backup);

    const read = await target.loadFreeSchedulerData();
    expect(read?.settings?.officePostcode).toBe("LS1 1UR");
    expect(read?.settings?.dayStart).toBe("07:00");
  });

  it("keeps settings when another store saves its own slice", async () => {
    const s = await freshModule();

    await Promise.all([
      s.updateSchedulerData((d) => ({
        ...d,
        settings: { officePostcode: "LS1 1UR", dayStart: "06:00", dayEnd: "22:00", country: "GB" },
      })),
      s.updateSchedulerData((d) => ({ ...d, staff: [staff("Priya")] })),
    ]);

    const read = await s.loadFreeSchedulerData();
    expect(read?.settings?.officePostcode).toBe("LS1 1UR");
    expect(read?.staff).toHaveLength(1);
  });

  it("clears everything on request", async () => {
    const s = await freshModule();
    await s.saveFreeSchedulerData({
      ...(await s.loadFreeSchedulerData())!,
      staff: [staff("Priya")],
    });

    await s.clearSchedulerData();

    const read = await s.loadFreeSchedulerData();
    expect(read?.staff).toEqual([]);
  });
});
