import { test, expect } from "@playwright/test";
import { watchErrors } from "./watchErrors";

test.describe("Scheduler page — pro user", () => {
  test("loads without errors", async ({ page }) => {
    const { errors, failed } = watchErrors(page);

    await page.goto("/scheduler");

    // Should not be redirected to login
    await expect(page).not.toHaveURL(/\/login/);

    // Give time for all async store loads to settle
    await page.waitForTimeout(2000);

    if (errors.length) console.log("Console errors:", errors);
    if (failed.length) console.log("Failed requests:", failed);

    expect(errors, "No console errors").toHaveLength(0);
    expect(failed, "No failed network requests").toHaveLength(0);
  });

  test("staff tab loads", async ({ page }) => {
    await page.goto("/staff");
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: "Staff" })).toBeVisible();
  });

  test("settings page loads", async ({ page }) => {
    await page.goto("/settings");
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
