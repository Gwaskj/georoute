"use client";

import { usePostcodeCheck } from "@/lib/postcode/usePostcodeCheck";
import { postcodeMessage } from "@/lib/postcode/validate";
import { useSettingsStore } from "@/store/settingsStore";

/**
 * Inline feedback under a postcode field.
 *
 * Advisory only -- it never blocks saving. Someone entering a brand new build
 * whose postcode has not reached the dataset yet, or working while the lookup
 * is unreachable, must still be able to get on with their day; the schedule
 * run will tell them if it genuinely cannot route to it. The value here is
 * catching the ordinary typo at the moment it is made rather than at the end.
 */
export default function PostcodeHint({ value }: { value: string }) {
  // Read from the store rather than passed in, so every field using this hint
  // follows the workspace's country without each caller having to remember.
  const country = useSettingsStore((s) => s.settings.country);
  const check = usePostcodeCheck(value, country);
  const message = postcodeMessage(check, country);
  if (!message) return null;

  const tone =
    check.status === "valid"
      ? "text-teal-400"
      : check.status === "not-found"
        ? "text-amber-400"
        : "text-slate-400";

  return (
    <p className={`mt-1 text-[11px] ${tone}`} role="status" aria-live="polite">
      {message}
    </p>
  );
}
