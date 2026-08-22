import { test, expect } from "@playwright/test";

/**
 * Google Analytics, checked by watching the wire rather than trusting the code.
 *
 * Two things have to hold at once, and they pull in opposite directions:
 * measurement has to work on ordinary pages, and it has to be completely
 * absent on the page that displays a carer's round. The round travels in the
 * URL fragment, so a single page_view from /my-round would hand every client
 * name and postcode to Google.
 */

const GA_COLLECT = /google-analytics\.com\/g\/collect|googletagmanager\.com\/gtag/;

function watchGa(page: import("@playwright/test").Page) {
  const hits: string[] = [];
  page.on("request", (req) => {
    if (GA_COLLECT.test(req.url())) hits.push(req.url());
  });
  return hits;
}

test.describe("Google Analytics", () => {
  test("loads and reports a page view on an ordinary page", async ({ page }) => {
    const hits = watchGa(page);

    await page.goto("/");
    await page.waitForTimeout(4000);

    expect(hits.length, "the tag should load and measure").toBeGreaterThan(0);
  });

  test("is not blocked by the Content-Security-Policy", async ({ page }) => {
    const violations: string[] = [];
    page.on("console", (msg) => {
      const t = msg.text();
      if (/Content Security Policy|Refused to (load|connect)/i.test(t)) {
        violations.push(t);
      }
    });

    await page.goto("/");
    await page.waitForTimeout(4000);

    expect(violations, "CSP must not block analytics").toEqual([]);
  });

  test("sends no fragment in the measured URL", async ({ page }) => {
    const hits = watchGa(page);

    // A fragment on an ordinary page. Nothing sensitive here, but the same
    // stripping is what protects /my-round, so it is worth asserting where it
    // is safe to do so.
    await page.goto("/pricing#a-fragment-that-must-not-be-measured");
    await page.waitForTimeout(4000);

    const leaked = hits.filter((h) =>
      /a-fragment-that-must-not-be-measured/.test(decodeURIComponent(h))
    );
    expect(leaked, `fragment reached Analytics:\n${leaked.join("\n")}`).toEqual([]);
  });

  test("does not run at all on a carer's round", async ({ browser }) => {
    // A fresh context, as a carer would have: no session, no consent choice.
    const carer = await browser.newContext();
    const carerPage = await carer.newPage();
    const hits = watchGa(carerPage);

    // A realistic-looking payload. It does not need to decode -- what matters
    // is that nothing is measured from this path at all.
    await carerPage.goto("/my-round#1SGVsbG8gdGhpcyBpcyBhIHJvdW5k");
    await carerPage.waitForTimeout(4000);

    expect(
      hits,
      `Analytics must never run on /my-round:\n${hits.join("\n")}`
    ).toEqual([]);

    await carer.close();
  });
});
