"use client";

import { useEffect, useState } from "react";
import { readConsent, clearConsent, applyConsent } from "@/lib/consent/consent";

/**
 * Footer link for changing an answer already given.
 *
 * Withdrawing consent has to be as easy as giving it, so this needs to be
 * reachable from every page rather than buried in the privacy policy.
 *
 * It only appears once a choice exists: before that the banner is already on
 * screen asking, and a second control saying the same thing would be noise.
 */
export default function ConsentSettingsLink() {
  const [decided, setDecided] = useState(false);

  useEffect(() => {
    // Deferred out of the effect body rather than read synchronously: this is
    // client-only state, and setting it during the effect is both a hydration
    // hazard and the thing react-hooks/set-state-in-effect exists to catch.
    const id = setTimeout(() => setDecided(readConsent() !== null), 0);
    return () => clearTimeout(id);
  }, []);

  if (!decided) return null;

  return (
    <button
      type="button"
      onClick={() => {
        // Revoke immediately rather than only on the next choice -- someone
        // clicking this has withdrawn consent by the act of clicking, and
        // should not stay opted in while they think about it.
        applyConsent("denied");
        clearConsent();
        window.location.reload();
      }}
      className="hover:text-slate-200"
    >
      Cookie settings
    </button>
  );
}
