import { describe, it, expect } from "vitest";
import { encodeRound, decodeRound, roundLink } from "./fragment";
import type { SharedSchedulePayload } from "./types";

/**
 * The round link is the only way a carer gets their day now, and the fragment
 * is the only copy of it. A decode that silently drops a visit sends someone
 * to four houses when five people are expecting them.
 */

function round(stops: number): SharedSchedulePayload {
  const names = [
    "Margaret Hughes", "Alan Whitfield", "Doris Pemberton", "Raymond Clarke",
    "Edith Nakamura", "Stanley Okonkwo", "Joan Fitzgerald", "Harold Bassett",
  ];
  const pcs = ["LS1 4DY", "LS2 8LX", "LS6 2AA", "LS11 5BD", "LS7 3PD"];

  return {
    staffName: "Priya Raghunathan",
    originLabel: "Office",
    originPostcode: "LS1 1UR",
    destinationLabel: "Office",
    destinationPostcode: "LS1 1UR",
    stops: Array.from({ length: stops }, (_, i) => ({
      clientName: names[i % names.length],
      postcode: pcs[i % pcs.length],
      address: `${i + 1} Example Street`,
      start: `2026-08-20T${String(8 + (i % 9)).padStart(2, "0")}:00:00.000Z`,
      end: `2026-08-20T${String(8 + (i % 9)).padStart(2, "0")}:30:00.000Z`,
    })),
    breaks: [{ start: "2026-08-20T12:00:00.000Z", end: "2026-08-20T12:30:00.000Z" }],
    generatedAt: "2026-08-19T22:00:00.000Z",
  };
}

describe("round fragment", () => {
  it("round trips a full day without losing anything", async () => {
    const original = round(12);
    const decoded = await decodeRound(await encodeRound(original));

    expect(decoded).toEqual(original);
  });

  it("keeps every stop, in order", async () => {
    const original = round(30);
    const decoded = await decodeRound(await encodeRound(original));

    expect(decoded?.stops).toHaveLength(30);
    expect(decoded?.stops.map((s) => s.clientName)).toEqual(
      original.stops.map((s) => s.clientName)
    );
  });

  it("handles an empty round", async () => {
    const original = { ...round(0), stops: [], breaks: [] };
    const decoded = await decodeRound(await encodeRound(original));

    expect(decoded?.stops).toEqual([]);
  });

  it("survives names outside ASCII", async () => {
    const original = round(3);
    original.stops[0].clientName = "Siobhán Ó Súilleabháin";
    original.stops[1].clientName = "Zoë Müller-Ştefănescu";
    original.stops[2].clientName = "أحمد الخالدي";

    const decoded = await decodeRound(await encodeRound(original));

    expect(decoded?.stops.map((s) => s.clientName)).toEqual(
      original.stops.map((s) => s.clientName)
    );
  });

  it("stays small enough to be a QR code", async () => {
    // A QR code holds about 2,900 bytes at its largest, and scans far more
    // reliably well under that. Fifty visits is a long day.
    const encoded = await encodeRound(round(50));
    expect(encoded.length).toBeLessThan(1200);
  });

  it("reads a link back out of its own URL", async () => {
    const original = round(8);
    const url = await roundLink("https://www.georoutes.co.uk", original);

    expect(url).toContain("/my-round#");
    const decoded = await decodeRound(url.split("#")[1]);
    expect(decoded?.staffName).toBe("Priya Raghunathan");
  });

  it("does not put a trailing slash into the link", async () => {
    const url = await roundLink("https://www.georoutes.co.uk/", round(1));
    expect(url).not.toContain(".co.uk//");
  });

  it("returns null rather than throwing on a truncated link", async () => {
    const encoded = await encodeRound(round(10));
    expect(await decodeRound(encoded.slice(0, encoded.length - 12))).toBeNull();
  });

  it("returns null on an unknown version", async () => {
    expect(await decodeRound("9abcdef")).toBeNull();
  });

  it("returns null on rubbish", async () => {
    expect(await decodeRound("")).toBeNull();
    expect(await decodeRound("not a real fragment")).toBeNull();
    expect(await decodeRound("1")).toBeNull();
  });

  it("rejects a payload with no stops array", async () => {
    // Someone editing the fragment by hand, or an older format.
    const bare = "0" + btoa(JSON.stringify({ staffName: "Nobody" }))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    expect(await decodeRound(bare)).toBeNull();
  });

  it("fills in missing optional fields rather than returning undefined", async () => {
    const bare = "0" + btoa(JSON.stringify({ stops: [] }))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const decoded = await decodeRound(bare);

    expect(decoded?.breaks).toEqual([]);
    expect(decoded?.staffName).toBe("");
  });

  it("reads an uncompressed link, for browsers without deflate-raw", async () => {
    const original = round(5);
    const raw = "0" + btoa(
      String.fromCharCode(...new TextEncoder().encode(JSON.stringify(original)))
    ).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

    expect((await decodeRound(raw))?.stops).toHaveLength(5);
  });
});
