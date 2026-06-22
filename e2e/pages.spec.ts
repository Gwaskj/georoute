import { test, expect } from "@playwright/test";

// Smoke tests: each page should load, not redirect to /login, and produce
// no console errors or failed network requests.
function smokeTest(name: string, path: string) {
  test(`${name} loads without errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    const failed: string[] = [];
    page.on("response", (res) => {
      if (res.status() >= 400) failed.push(`${res.status()} ${res.url()}`);
    });

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
  smokeTest("billing", "/account/billing");
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
  smokeTest("pricing", "/pricing");
});
