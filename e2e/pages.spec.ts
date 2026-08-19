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
  smokeTest("help guide", "/help/care-planning");
});

test.describe("Pro pages", () => {
  smokeTest("calendar", "/calendar");
});
