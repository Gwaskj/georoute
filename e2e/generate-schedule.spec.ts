import { test, expect } from "@playwright/test";

test.describe("Generate schedule flow", () => {
  // Hits the live routing API, so it needs a real wait -- this was skipped
  // with a note blaming a Playwright bug, but it was only ever waiting three
  // seconds for a round trip that takes closer to twenty.
  test("generates a schedule and shows results", async ({ page }) => {
    await page.goto("/scheduler");
    await expect(page).not.toHaveURL(/\/login/);

    // Setup tab is default — click Generate
    const generateButton = page.getByRole("button", { name: /generate schedule/i });
    await expect(generateButton).toBeVisible();
    await generateButton.click();

    // Should not show the routing error box
    await page.waitForTimeout(18000);
    const routingError = page.getByText(/routing error/i);
    await expect(routingError).toHaveCount(0);

    // Switch to Results tab
    await page.getByRole("button", { name: "Results" }).click();
    await expect(page.getByText("Staff results")).toBeVisible();
  });
});
