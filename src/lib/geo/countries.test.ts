import { describe, it, expect } from "vitest";
import {
  COUNTRIES,
  COUNTRY_LIST,
  countryConfig,
  isCountryCode,
  DEFAULT_COUNTRY,
} from "./countries";

/**
 * Country handling, where a mistake is a carer driving to the wrong place.
 *
 * The motivating case is real: asked as free text, a geocoder resolved the
 * Canadian postal code K1A 0B1 to Pike County, Kentucky. It did not fail --
 * it answered confidently, a thousand miles out. Everything here exists to
 * make a country impossible to omit or confuse.
 */
describe("country configuration", () => {
  it("names the postcode the way each country does", () => {
    expect(COUNTRIES.GB.postcodeLabel).toBe("Postcode");
    expect(COUNTRIES.US.postcodeLabel).toBe("ZIP code");
    expect(COUNTRIES.CA.postcodeLabel).toBe("Postal code");
  });

  it("falls back rather than throwing on an unknown code", () => {
    // A workspace saved before countries existed, or an edited export.
    expect(countryConfig(undefined).code).toBe(DEFAULT_COUNTRY);
    expect(countryConfig(null).code).toBe(DEFAULT_COUNTRY);
    expect(countryConfig("ZZ").code).toBe(DEFAULT_COUNTRY);
    expect(countryConfig("").code).toBe(DEFAULT_COUNTRY);
  });

  it("recognises only the countries it supports", () => {
    expect(isCountryCode("GB")).toBe(true);
    expect(isCountryCode("US")).toBe(true);
    expect(isCountryCode("FR")).toBe(false);
    expect(isCountryCode(null)).toBe(false);
    expect(isCountryCode("")).toBe(false);
  });

  it("offers only the UK, deliberately", () => {
    // The others are configured and verified against the live geocoder, but a
    // US ZIP covers thousands of homes -- two clients in one come back zero
    // minutes apart. Fixing that needs address-level geocoding, which would
    // turn route_cache from postcode pairs into a list of households.
    // See COUNTRY_LIST for the full reasoning.
    expect(COUNTRY_LIST.map((c) => c.code)).toEqual(["GB"]);
    expect(DEFAULT_COUNTRY).toBe("GB");
  });

  it("keeps the other countries configured, ready to re-offer", () => {
    // Removing them outright would mean rebuilding and re-verifying later.
    expect(Object.keys(COUNTRIES).sort()).toEqual(["AU", "CA", "GB", "US"]);
  });
});

describe("postcode shapes", () => {
  const accepts = (code: keyof typeof COUNTRIES, value: string) => {
    const c = COUNTRIES[code];
    return c.pattern.test(c.normalise(value));
  };

  it("accepts real postcodes in each country", () => {
    expect(accepts("GB", "LS1 1UR")).toBe(true);
    expect(accepts("GB", "ls11ur")).toBe(true);
    expect(accepts("GB", "GIR 0AA")).toBe(true);
    expect(accepts("US", "90210")).toBe(true);
    expect(accepts("US", "90210-1234")).toBe(true);
    expect(accepts("CA", "K1A 0B1")).toBe(true);
    expect(accepts("CA", "k1a0b1")).toBe(true);
    expect(accepts("AU", "3000")).toBe(true);
  });

  it("rejects one country's format under another", () => {
    // The whole point. A UK postcode entered while the workspace is set to the
    // US should be refused at the field rather than sent to a geocoder that
    // will confidently place it somewhere.
    expect(accepts("US", "LS1 1UR")).toBe(false);
    expect(accepts("CA", "90210")).toBe(false);
    expect(accepts("GB", "90210")).toBe(false);
    expect(accepts("GB", "K1A 0B1")).toBe(false);
  });

  it("does not accept an Australian postcode as American", () => {
    // Both are digits, which is exactly the kind of near-miss that makes a
    // country-scoped lookup necessary rather than merely tidy.
    expect(accepts("US", "3000")).toBe(false);
    expect(accepts("AU", "90210")).toBe(false);
  });

  it("normalises to the form each country writes", () => {
    expect(COUNTRIES.GB.normalise(" ls1  1ur ")).toBe("LS1 1UR");
    expect(COUNTRIES.CA.normalise("k1a0b1")).toBe("K1A 0B1");
    expect(COUNTRIES.US.normalise(" 90210 ")).toBe("90210");
  });

  it("leaves a part-typed value alone rather than mangling it", () => {
    // Normalisation runs on every keystroke, so it must not rearrange
    // something incomplete into a shape the person did not type.
    expect(COUNTRIES.GB.normalise("LS1")).toBe("LS1");
    expect(COUNTRIES.CA.normalise("K1A")).toBe("K1A");
  });
});
