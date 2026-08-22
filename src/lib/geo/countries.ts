/**
 * The countries GeoRoutes can plan in, and what each one calls a postcode.
 *
 * Routing was never the UK-only part -- OpenRouteService runs on worldwide OSM
 * data and the scheduling engine is arithmetic on travel minutes, which does
 * not care where it happens. What was UK-only is geocoding: turning a postcode
 * into a pair of coordinates, which went through postcodes.io.
 *
 * Every lookup is scoped to one of these countries rather than sent as free
 * text. That is not tidiness. Asked without a country, a public geocoder placed
 * the Canadian postal code K1A 0B1 in Pike County, Kentucky -- a confident
 * answer, a thousand miles wrong, and in this application that is a carer
 * driving to another country. A wrong country must be impossible to express,
 * not merely unlikely.
 */

/**
 * Only countries whose postcodes actually geocode.
 *
 * Ireland and New Zealand were written and then removed after testing against
 * the live geocoder. Eircodes answered for Cork but not for two Dublin codes,
 * and no New Zealand postcode resolved at all -- both datasets are proprietary
 * and poorly represented in open data. Offering a country the router cannot
 * place would be a promise the product fails to keep at the worst moment, so
 * they are absent rather than unreliable.
 */
export type CountryCode = "GB" | "US" | "CA" | "AU";

export interface CountryConfig {
  code: CountryCode;
  name: string;
  /** What people there call it. Used for every field label and message. */
  postcodeLabel: string;
  /** Shown in the field so the expected shape is obvious. */
  example: string;
  /**
   * Shape check, used only to avoid asking the network about something that
   * cannot be right. The authority on existence is always the lookup.
   *
   * Deliberately loose where a country's format is genuinely varied: rejecting
   * a real address is far worse than allowing a lookup that comes back empty.
   */
  pattern: RegExp;
  /** How to normalise for display and for use as a cache key. */
  normalise: (raw: string) => string;
}

/** Uppercase, collapse spaces, then a single space before the last three. */
function ukStyle(raw: string): string {
  const v = raw.trim().toUpperCase().replace(/\s+/g, "");
  if (v.length < 5) return v;
  return `${v.slice(0, v.length - 3)} ${v.slice(-3)}`;
}

/** Uppercase and collapse to a single space. */
function plain(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, " ");
}

export const COUNTRIES: Record<CountryCode, CountryConfig> = {
  GB: {
    code: "GB",
    name: "United Kingdom",
    postcodeLabel: "Postcode",
    example: "LS1 1UR",
    // Includes the GIR 0AA special case.
    pattern: /^(GIR ?0AA|[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2})$/,
    normalise: ukStyle,
  },
  US: {
    code: "US",
    name: "United States",
    postcodeLabel: "ZIP code",
    example: "90210",
    // Five digits, optionally the four-digit extension.
    pattern: /^[0-9]{5}(-[0-9]{4})?$/,
    normalise: (raw) => raw.trim().replace(/\s+/g, ""),
  },
  CA: {
    code: "CA",
    name: "Canada",
    postcodeLabel: "Postal code",
    example: "K1A 0B1",
    // Letter-digit-letter, space, digit-letter-digit. D, F, I, O, Q and U
    // never appear in the first position, and W and Z never start a postal
    // code at all -- but allowing them costs a failed lookup, while excluding
    // a valid one costs an address that cannot be entered.
    pattern: /^[A-Z][0-9][A-Z]\s?[0-9][A-Z][0-9]$/,
    normalise: (raw) => {
      const v = raw.trim().toUpperCase().replace(/\s+/g, "");
      return v.length === 6 ? `${v.slice(0, 3)} ${v.slice(3)}` : v;
    },
  },
  AU: {
    code: "AU",
    name: "Australia",
    postcodeLabel: "Postcode",
    example: "3000",
    pattern: /^[0-9]{4}$/,
    normalise: (raw) => raw.trim().replace(/\s+/g, ""),
  },
};

export const DEFAULT_COUNTRY: CountryCode = "GB";

/** Never throws: an unknown code falls back rather than breaking a form. */
export function countryConfig(code: string | null | undefined): CountryConfig {
  return COUNTRIES[(code ?? "") as CountryCode] ?? COUNTRIES[DEFAULT_COUNTRY];
}

export function isCountryCode(value: string | null | undefined): value is CountryCode {
  return !!value && value in COUNTRIES;
}

/** In the order they appear in the picker. */
export const COUNTRY_LIST: CountryConfig[] = [
  COUNTRIES.GB,
  COUNTRIES.US,
  COUNTRIES.CA,
  COUNTRIES.AU,
];

export { plain as normalisePlain };
