// src/lib/validatePostcode.ts

// Royal Mail–compliant simplified UK postcode validator
export function isValidUKPostcode(postcode: string): boolean {
  if (!postcode) return false;

  const cleaned = postcode.trim().toUpperCase();

  const UK_POSTCODE_REGEX =
    /^[A-Z]{1,2}[0-9][0-9A-Z]?\s?[0-9][A-Z]{2}$/;

  return UK_POSTCODE_REGEX.test(cleaned);
}

export function normalisePostcode(postcode: string): string {
  return postcode.trim().toUpperCase().replace(/\s+/g, "");
}
