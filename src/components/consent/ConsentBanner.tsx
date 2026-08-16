"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  readConsent,
  writeConsent,
  applyConsent,
  consentRequired,
  type ConsentChoice,
} from "@/lib/consent/consent";

/**
 * Asks whether analytics may store anything on the device.
 *
 * Accept and Reject are the same size, weight and colour. That is not
 * decoration: consent has to be as easy to refuse as to give, and a grey
 * "Reject" beside a bright "Accept" is the specific pattern regulators have
 * called out. There is no third "manage" step because there is nothing to
 * manage -- one tag, one purpose.
 *
 * Nothing is stored and no consent is granted until a button is pressed. A
 * visitor who ignores the banner entirely stays in the denied default, which
 * is what makes ignoring it a valid answer rather than a deferred yes.
 */
export default function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let active = true;

    (async () => {
      // Already answered: re-apply it so the tag matches the stored choice on
      // every page load, then stay out of the way.
      const existing = readConsent();
      if (existing) {
        applyConsent(existing);
        return;
      }

      // Outside the UK, EEA and Switzerland the tag's defaults are already
      // granted, so there is nothing to ask about and no banner to show.
      if (!(await consentRequired())) return;

      // Deferred a little so the banner does not compete with the page for
      // the first moment of load.
      if (active) setTimeout(() => active && setVisible(true), 900);
    })();

    return () => {
      active = false;
    };
  }, []);

  // Reserve the space the banner occupies while it is up, so anything at the
  // foot of a page can still be scrolled to and clicked. Being fixed, it
  // otherwise sits on top of whatever happens to be at the bottom of the
  // viewport, and the footer links were exactly that.
  useEffect(() => {
    if (!visible) return;
    const previous = document.body.style.paddingBottom;
    document.body.style.paddingBottom = "7rem";
    return () => {
      document.body.style.paddingBottom = previous;
    };
  }, [visible]);

  const decide = (choice: ConsentChoice) => {
    writeConsent(choice);
    applyConsent(choice);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Analytics cookies"
      // z-40 keeps this beneath the modals, which are z-50. Above them it
      // covered the Add button in the staff and appointment dialogs, so a
      // first-time visitor in the UK could not add anything until they had
      // answered -- the banner is meant to be ignorable, and blocking the
      // product until it is dealt with is the opposite of that.
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-700 bg-slate-900/98 px-4 py-4 backdrop-blur"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-relaxed text-slate-300">
          We&apos;d like to use Google Analytics to count visits and see which
          pages are read. It stores a small identifier on your device.{" "}
          <span className="text-slate-400">
            Decline and the site works exactly the same — we just count less
            precisely.
          </span>{" "}
          <Link href="/privacy" className="text-teal-400 underline hover:text-teal-300">
            Privacy policy
          </Link>
        </p>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => decide("denied")}
            className="rounded-full border border-slate-600 px-5 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => decide("granted")}
            className="rounded-full border border-slate-600 px-5 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
