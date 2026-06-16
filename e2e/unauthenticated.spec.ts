import { test, expect } from "@playwright/test";

// These pages should be reachable WITHOUT a logged-in session, so override
// the project's stored auth state with an empty one for this file.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Unauthenticated pages", () => {
  test("login page loads", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto("/login");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();

    expect(errors, "No console errors").toHaveLength(0);
  });

  test("signup page loads", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto("/signup");
    expect(errors, "No console errors").toHaveLength(0);
  });

  test("home page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).not.toHaveURL(/\/login/);
  });
});
