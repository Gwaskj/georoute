"use client";

import { useEffect, useState } from "react";
import { checkPostcode, type PostcodeCheck } from "./validate";
import { DEFAULT_COUNTRY, type CountryCode } from "@/lib/geo/countries";

/**
 * Live postcode check for a form field.
 *
 * Debounced because this runs against a controlled input: without it every
 * keystroke of "LS1 4DY" is a separate request, six of which are for prefixes
 * that cannot be valid yet. The in-flight request is aborted when the value
 * changes again, so a slow reply for an old value cannot overwrite the result
 * for what is in the field now.
 *
 * The result is stored tagged with the value it describes, and the hook
 * returns it only while that tag still matches. That keeps the empty and
 * pending cases out of state entirely -- deriving them avoids a setState in
 * the effect body, and it means the previous postcode's verdict is never shown
 * against a newly typed one during the debounce window.
 */
export function usePostcodeCheck(
  value: string,
  country: CountryCode = DEFAULT_COUNTRY,
  debounceMs = 450
): PostcodeCheck {
  const [result, setResult] = useState<{ for: string; check: PostcodeCheck } | null>(
    null
  );

  useEffect(() => {
    if (!value.trim()) return;

    const ac = new AbortController();
    const timer = setTimeout(() => {
      checkPostcode(value, country, ac.signal).then((check) => {
        if (!ac.signal.aborted) setResult({ for: `${country}:${value}`, check });
      });
    }, debounceMs);

    return () => {
      clearTimeout(timer);
      ac.abort();
    };
    // Country is a dependency: switching it must re-check what is already in
    // the field, since the same characters can be valid in one country and
    // meaningless in another.
  }, [value, country, debounceMs]);

  if (!value.trim()) return { status: "empty" };

  // Say nothing until the lookup for this exact value has landed. "empty"
  // renders no message, which is the right thing to show mid-type.
  return result?.for === `${country}:${value}` ? result.check : { status: "empty" };
}
