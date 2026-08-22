// Postcode checking shared by the staff and appointment forms.
//
// Until now a postcode was only tested when a schedule was generated, by which
// point the run aborts and the person has to work out which of several entries
// carries the typo. Checking at the point of entry catches it while they are
// still looking at the field that caused it.
//
// The UK path still goes to postcodes.io, which is free, fast, needs no key and
// is more accurate for UK postcodes than any general geocoder. Everywhere else
// goes through the routing function, which geocodes scoped to one country --
// asked without a country, a public geocoder places the Canadian postal code
// K1A 0B1 in Kentucky.

import { countryConfig, type CountryCode, DEFAULT_COUNTRY } from "@/lib/geo/countries";
import { supabase } from "@/lib/supabase/client";

export type PostcodeCheck =
  | { status: "empty" }
  /** Wrong shape -- no point asking the network about it. */
  | { status: "malformed" }
  /** Correct shape and a real postcode. `place` is shown back as confirmation. */
  | { status: "valid"; place: string | null }
  /** Correct shape but no such postcode. Nearly always a typo. */
  | { status: "not-found" }
  /** The lookup itself failed. Deliberately not treated as invalid. */
  | { status: "unavailable" };

/**
 * Shape check for a UK postcode, including the GIR 0AA special case.
 *
 * Kept exported because several callers still use it directly for UK-only
 * paths; new code should prefer looksLikePostcode with a country.
 */
export function looksLikeUkPostcode(value: string): boolean {
  return looksLikePostcode(value, "GB");
}

export function looksLikePostcode(value: string, country: CountryCode): boolean {
  const cfg = countryConfig(country);
  return cfg.pattern.test(cfg.normalise(value));
}

/** Uppercase, single space before the inward code. UK shape. */
export function normalisePostcode(value: string, country: CountryCode = DEFAULT_COUNTRY): string {
  return countryConfig(country).normalise(value);
}

// Postcodes do not change while a form is open, so a result is worth keeping:
// editing the surrounding fields, or reopening the dialog to correct something
// else, should not re-ask the network about one already confirmed. Keyed by
// country as well as value, because "3000" is a real postcode in more than one
// place and they are not the same place.
const cache = new Map<string, PostcodeCheck>();

export function clearPostcodeCache(): void {
  cache.clear();
}

export async function checkPostcode(
  value: string,
  country: CountryCode = DEFAULT_COUNTRY,
  signal?: AbortSignal
): Promise<PostcodeCheck> {
  const raw = value.trim();
  if (!raw) return { status: "empty" };

  const cfg = countryConfig(country);
  const normalised = cfg.normalise(raw);
  if (!cfg.pattern.test(normalised)) return { status: "malformed" };

  const key = `${cfg.code}:${normalised}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const result =
    cfg.code === "GB"
      ? await checkViaPostcodesIo(normalised, signal)
      : await checkViaGeocoder(normalised, cfg.code);

  // An unavailable lookup is a fact about the network right now, not about the
  // postcode, so it must not be remembered as a verdict.
  if (result.status !== "unavailable") cache.set(key, result);
  return result;
}

async function checkViaPostcodesIo(
  normalised: string,
  signal?: AbortSignal
): Promise<PostcodeCheck> {
  try {
    const res = await fetch(
      `https://api.postcodes.io/postcodes/${encodeURIComponent(normalised)}`,
      { signal }
    );
    if (res.status === 404) return { status: "not-found" };
    if (!res.ok) {
      // Rate limited, 5xx, anything else -- not the person's fault, so it must
      // not read as "your postcode is wrong".
      return { status: "unavailable" };
    }
    const json = await res.json();
    const r = json?.result;
    return {
      status: "valid",
      place: r?.admin_district ?? r?.parish ?? r?.region ?? null,
    };
  } catch {
    // Offline, blocked, or aborted. Never block submission on this.
    return { status: "unavailable" };
  }
}

/**
 * Everywhere except the UK, via the routing function.
 *
 * Done there rather than from the browser because that is where the geocoding
 * key lives, and because it is the same lookup the router will perform -- so
 * "valid" keeps meaning "the router will be able to place this" rather than
 * dropping to "looks about right".
 */
async function checkViaGeocoder(
  normalised: string,
  country: CountryCode
): Promise<PostcodeCheck> {
  try {
    const { data, error } = await supabase.functions.invoke("route-optimizer", {
      body: { geocodeOnly: true, postcode: normalised, country },
    });
    if (error) return { status: "unavailable" };
    if (data?.found === false) return { status: "not-found" };
    if (!data?.found) return { status: "unavailable" };
    return { status: "valid", place: data.place ?? null };
  } catch {
    return { status: "unavailable" };
  }
}

/** Message shown under the field, or null where saying nothing is better. */
export function postcodeMessage(
  check: PostcodeCheck,
  country: CountryCode = DEFAULT_COUNTRY
): string | null {
  const label = countryConfig(country).postcodeLabel.toLowerCase();
  switch (check.status) {
    case "malformed":
      return `That does not look like a ${countryConfig(country).name} ${label}.`;
    case "not-found":
      return `No such ${label} — check for a typo.`;
    case "valid":
      return check.place ? `Recognised — ${check.place}` : `Recognised ${label}`;
    // "empty" and "unavailable" both stay silent: nothing has been typed yet,
    // or the checker is the thing that failed, and neither is worth a warning.
    default:
      return null;
  }
}
