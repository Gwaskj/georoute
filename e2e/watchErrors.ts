import type { Page } from "@playwright/test";

/**
 * Requests expected to fail when the suite runs off Cloudflare.
 *
 * /cdn-cgi/trace is injected by Cloudflare's edge, so it answers in production
 * and 404s against `next start`. The consent code already treats a failure as
 * "assume consent is required", which is the safe direction, so this is a fact
 * about where the test is running rather than a defect.
 *
 * Kept deliberately narrow. Forgiving 404s in general would have hidden every
 * route deleted when client data moved into the browser.
 */
const EXPECTED_OFF_CLOUDFLARE = /\/cdn-cgi\//;

/**
 * Collect console errors and failed requests, minus the ones above.
 *
 * The browser reports a failed subresource as a bare "Failed to load resource"
 * with no URL attached, so the only way to know which request a line refers to
 * is to correlate it with the responses seen on the same page. Hence the
 * counter rather than a message pattern: it drops exactly as many lines as
 * there were forgiven requests, and a genuine second failure still surfaces.
 */
export function watchErrors(page: Page) {
  const errors: string[] = [];
  const failed: string[] = [];
  let forgiven = 0;

  page.on("response", (res) => {
    if (res.status() < 400) return;
    if (EXPECTED_OFF_CLOUDFLARE.test(res.url())) forgiven++;
    else failed.push(`${res.status()} ${res.url()}`);
  });

  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (/Failed to load resource/i.test(text) && forgiven > 0) {
      forgiven--;
      return;
    }
    errors.push(text);
  });

  return { errors, failed };
}
