"use client";

import { useEffect, useState } from "react";
import { checkPostcode, type PostcodeCheck } from "./validate";

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
export function usePostcodeCheck(value: string, debounceMs = 450): PostcodeCheck {
  const [result, setResult] = useState<{ for: string; check: PostcodeCheck } | null>(
    null
  );

  useEffect(() => {
    if (!value.trim()) return;

    const ac = new AbortController();
    const timer = setTimeout(() => {
      checkPostcode(value, ac.signal).then((check) => {
        if (!ac.signal.aborted) setResult({ for: value, check });
      });
    }, debounceMs);

    return () => {
      clearTimeout(timer);
      ac.abort();
    };
  }, [value, debounceMs]);

  if (!value.trim()) return { status: "empty" };

  // Say nothing until the lookup for this exact value has landed. "empty"
  // renders no message, which is the right thing to show mid-type.
  return result?.for === value ? result.check : { status: "empty" };
}
