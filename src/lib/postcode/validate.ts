// Postcode checking shared by the staff and appointment forms.
//
// Until now a postcode was only tested when a schedule was generated, by which
// point the run aborts and the person has to work out which of several entries
// carries the typo. Checking at the point of entry catches it while they are
// still looking at the field that caused it.
//
// postcodes.io is the same service the routing Edge Function geocodes with, so
// "valid" here means "the router will be able to place this" rather than
// merely "well formed" -- a postcode of the right shape that does not exist,
// which is what a typo usually produces, is exactly the case a regex misses.

export type PostcodeCheck =
  | { status: "empty" }
  /** Wrong shape -- no point asking the network about it. */
  | { status: "malformed" }
  /** Correct shape and a real postcode. `place` is the district, shown back as confirmation. */
  | { status: "valid"; place: string | null }
  /** Correct shape but no such postcode. Nearly always a typo. */
  | { status: "not-found" }
  /** The lookup itself failed. Deliberately not treated as invalid. */
  | { status: "unavailable" };

/**
 * Shape check for a UK postcode, including the GIR 0AA special case.
 *
 * Used only to avoid pointless network calls while someone is mid-type; the
 * authority on whether a postcode exists is the lookup, not this pattern.
 */
export function looksLikeUkPostcode(value: string): boolean {
  const v = value.trim().toUpperCase().replace(/\s+/g, " ");
  if (v === "GIR 0AA" || v === "GIR0AA") return true;
  return /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/.test(v);
}

/** Uppercase, single space before the inward code. */
export function normalisePostcode(value: string): string {
  const v = value.trim().toUpperCase().replace(/\s+/g, "");
  if (v.length < 5) return v;
  return `${v.slice(0, v.length - 3)} ${v.slice(-3)}`;
}

// Postcodes do not change while a form is open, so a result is worth keeping:
// editing the surrounding fields, or reopening the dialog to correct something
// else, should not re-ask the network about a postcode already confirmed.
const cache = new Map<string, PostcodeCheck>();

export function clearPostcodeCache(): void {
  cache.clear();
}

export async function checkPostcode(
  value: string,
  signal?: AbortSignal
): Promise<PostcodeCheck> {
  const raw = value.trim();
  if (!raw) return { status: "empty" };

  const normalised = normalisePostcode(raw);
  if (!looksLikeUkPostcode(normalised)) return { status: "malformed" };

  const cached = cache.get(normalised);
  if (cached) return cached;

  let result: PostcodeCheck;
  try {
    const res = await fetch(
      `https://api.postcodes.io/postcodes/${encodeURIComponent(normalised)}`,
      { signal }
    );
    if (res.status === 404) {
      result = { status: "not-found" };
    } else if (!res.ok) {
      // Rate limited, 5xx, anything else -- not the person's fault, so it must
      // not read as "your postcode is wrong".
      return { status: "unavailable" };
    } else {
      const json = await res.json();
      const r = json?.result;
      result = {
        status: "valid",
        place: r?.admin_district ?? r?.parish ?? r?.region ?? null,
      };
    }
  } catch {
    // Offline, blocked, or aborted. Never block submission on this.
    return { status: "unavailable" };
  }

  cache.set(normalised, result);
  return result;
}

/** Message shown under the field, or null where saying nothing is better. */
export function postcodeMessage(check: PostcodeCheck): string | null {
  switch (check.status) {
    case "malformed":
      return "That does not look like a UK postcode.";
    case "not-found":
      return "No such UK postcode — check for a typo.";
    case "valid":
      return check.place ? `Recognised — ${check.place}` : "Recognised postcode";
    // "empty" and "unavailable" both stay silent: nothing has been typed yet,
    // or the checker is the thing that failed, and neither is worth a warning.
    default:
      return null;
  }
}
