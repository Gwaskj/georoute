import { test, expect } from "@playwright/test";
import { watchErrors } from "./watchErrors";

// Smoke tests: each page should load, not redirect to /login, and produce no
// console errors or failed network requests.
function smokeTest(name: string, path: string) {
  test(`${name} loads without errors`, async ({ page }) => {
    // The /_vercel/ stub that used to live here is gone with Vercel itself.
    // Nothing requests those paths any more, so stubbing them would only hide
    // a request that should not be happening.
    const { errors, failed } = watchErrors(page);

    await page.goto(path);
    await expect(page).not.toHaveURL(/\/login/);
    await page.waitForTimeout(1500);

    if (errors.length) console.log(`[${path}] Console errors:`, errors);
    if (failed.length) console.log(`[${path}] Failed requests:`, failed);

    expect(errors, "No console errors").toHaveLength(0);
    expect(failed, "No failed network requests").toHaveLength(0);
  });
}

test.describe("Account pages", () => {
  smokeTest("account", "/account");
  // /account/billing was merged into /account and now 404s; the test for it
  // outlived the page.
});

test.describe("Admin pages", () => {
  smokeTest("admin dashboard", "/admin");
  smokeTest("admin appointments", "/admin/appointments");
  smokeTest("admin editor", "/admin/editor");
  smokeTest("admin header-editor", "/admin/header-editor");
  smokeTest("admin logs", "/admin/logs");
  smokeTest("admin pricing", "/admin/pricing");
  smokeTest("admin schedule", "/admin/schedule");
  smokeTest("admin settings", "/admin/settings");
  smokeTest("admin staff", "/admin/staff");
  smokeTest("admin themes", "/admin/themes");
  smokeTest("admin users", "/admin/users");
});

test.describe("Public pages", () => {
  smokeTest("home", "/");
  smokeTest("pricing", "/pricing");
  smokeTest("how it works", "/how-it-works");
  smokeTest("help hub", "/help");
  smokeTest("help guide", "/help/getting-started");
  // The sector pages moved out of /help to the top level. Covered here so a
  // broken move shows up as a failing test rather than as four 404s.
  smokeTest("care planning", "/care-planning");
  smokeTest("community nursing", "/community-nursing");
  smokeTest("occupational therapy", "/occupational-therapy");
  smokeTest("physiotherapy", "/physiotherapy");
  // The only page that frames a third party, so the only one where a
  // Content-Security-Policy mistake shows up as a blank box rather than a
  // console warning. It was not covered before.
  smokeTest("feedback", "/feedback");
  smokeTest("privacy", "/privacy");
  smokeTest("terms", "/terms");
});

test.describe("Pro pages", () => {
  smokeTest("calendar", "/calendar");
});
