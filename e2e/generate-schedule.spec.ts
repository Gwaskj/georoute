import { test, expect } from "@playwright/test";

/**
 * End-to-end generation, with its own data.
 *
 * This used to press Generate against whatever happened to be in the account
 * and assert that results appeared, so it passed or failed depending on
 * ambient state -- and started failing the moment the workspace was empty,
 * which is not a fault in the application. It now sets up what it needs and
 * clears up after itself.
 *
 * One test rather than two, run in sequence, because both cases share one
 * workspace: a second test cannot assume the state the first left, and
 * clearing between them is the same work as doing it in order here.
 *
 * Names are prefixed so anything left by an interrupted run is identifiable
 * rather than mistaken for real data.
 */
const PREFIX = "E2E-TEMP";

// Real routing calls against the live function; the default 30s is not enough.
test.setTimeout(120_000);

async function clearWorkspace(page: import("@playwright/test").Page) {
  // Confirm dialogs must be handled before the click that raises them.
  page.on("dialog", (d) => d.accept().catch(() => {}));
  for (let round = 0; round < 3; round++) {
    const clear = page.getByRole("button", { name: "Clear all", exact: true });
    if ((await clear.count()) === 0) break;
    await clear.first().click().catch(() => {});
    await page.waitForTimeout(1500);
  }
}

test.describe("Generate schedule flow", () => {
  test("explains an empty workspace, then schedules data it creates", async ({ page }) => {
    await page.goto("/scheduler");
    await expect(page).not.toHaveURL(/\/login/);
    await page.waitForTimeout(2500);

    await clearWorkspace(page);

    // --- Part 1: nothing to schedule should say so, not produce an empty plan.
    await page.getByRole("button", { name: /generate schedule/i }).first().click();
    await page.waitForTimeout(4000);
    await expect(
      page
        .getByText(/No staff have been added|No appointments have been added|None of your/i)
        .first(),
      "generating with an empty workspace should explain why, not go quiet"
    ).toBeVisible();

    // --- Part 2: with real data it should actually schedule.
    await page.getByRole("button", { name: "Add staff", exact: true }).first().click();
    await page.waitForTimeout(1400);
    await page.locator("input[type=text]").nth(0).fill(`${PREFIX} Carer`);
    await page.locator("input[type=text]").nth(1).fill("LS1 1UR");
    await page.getByRole("button", { name: "Add", exact: true }).first().click();
    await page.waitForTimeout(1800);

    await page.getByRole("button", { name: "Add appointment", exact: true }).first().click();
    await page.waitForTimeout(1400);
    const text = page.locator("input[type=text]");
    await text.nth(0).fill(`${PREFIX} Client`);
    await text.nth(3).fill("LS1 4DY");
    await page.locator("input[type=number]").nth(0).fill("30");
    await page.getByRole("button", { name: "Add", exact: true }).first().click();
    await page.waitForTimeout(1800);

    await page.getByRole("button", { name: /generate schedule/i }).first().click();
    await page.waitForTimeout(28000);

    await expect(page.getByText(/routing error|Could not find/i)).toHaveCount(0);

    await page.getByRole("button", { name: "Results", exact: true }).click();
    await expect(page.getByText("Staff results")).toBeVisible();
    await expect(page.getByText(`${PREFIX} Carer`).first()).toBeVisible();

    // --- Leave the workspace as it was found.
    await page.getByRole("button", { name: "Setup", exact: true }).click();
    await page.waitForTimeout(1500);
    await clearWorkspace(page);
  });
});
