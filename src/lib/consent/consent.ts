/**
 * Analytics consent.
 *
 * The site currently sets no cookies at all: Google Analytics runs with
 * storage denied, so it sends cookieless pings and cannot tell a returning
 * visitor from a new one. That is a clean position legally but a poor one for
 * actually understanding traffic, and asking is the only way out of it.
 *
 * PECR requires prior consent before storing anything on a device, so nothing
 * here runs before a choice is made. The choice itself is kept in
 * localStorage, which is permitted without consent because it exists solely to
 * remember the answer -- asking again on every page would be worse for the
 * visitor and is what the exemption is for.
 */

export type ConsentChoice = "granted" | "denied";

const STORAGE_KEY = "ga-consent";

/**
 * Countries where analytics storage needs prior consent: the EEA, the UK and
 * Switzerland. Kept in step with the region list the tag declares its denied
 * defaults for -- if the two ever disagree, a visitor could be asked for
 * consent the tag was never withholding, or worse, not asked when it was.
 */
const CONSENT_REQUIRED = new Set([
  "GB", "CH",
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR",
  "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK",
  "SI", "ES", "SE",
  "IS", "LI", "NO",
]);

export function readConsent(): ConsentChoice | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    // Storage can be blocked entirely. Treated as "not asked yet", which
    // keeps the tag in its denied default -- the safe direction.
    return null;
  }
}

export function writeConsent(choice: ConsentChoice): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, choice);
  } catch {
    // If it cannot be stored the banner returns next visit. Annoying, not
    // harmful, and not a reason to fail the update below.
  }
}

export function clearConsent(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* nothing to do */
  }
}

/**
 * Tell the Google tag what was decided.
 *
 * Only analytics storage moves. The three advertising purposes stay denied
 * permanently: there is no advertising on this site, and granting them would
 * claim a consent that was never asked for.
 */
export function applyConsent(choice: ConsentChoice): void {
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  if (!gtag) return;
  gtag("consent", "update", { analytics_storage: choice });
}

/**
 * Whether this visitor's country requires asking.
 *
 * Read from Cloudflare's own trace endpoint, which is same-origin, needs no
 * third party, sets nothing, and is already in front of every request. A
 * failure returns true: if it cannot be established that consent is
 * unnecessary, the honest thing is to ask.
 */
export async function consentRequired(): Promise<boolean> {
  try {
    const res = await fetch("/cdn-cgi/trace", { cache: "no-store" });
    if (!res.ok) return true;
    const text = await res.text();
    const loc = text.match(/^loc=([A-Z]{2})$/m)?.[1];
    if (!loc) return true;
    return CONSENT_REQUIRED.has(loc);
  } catch {
    return true;
  }
}
