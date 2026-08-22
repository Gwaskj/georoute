import { test, expect } from "@playwright/test";
import { addStaff, addAppointment, setOfficePostcode } from "./workspace";

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
    // Without an office postcode nobody has anywhere to start from, and
    // generating is now refused with that explanation rather than producing a
    // round with no beginning. Set it first so the test exercises the path it
    // means to.
    await setOfficePostcode(page, "LS1 1UR");

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
    await addStaff(page, `${PREFIX} Carer`, "LS1 1UR");

    await addAppointment(page, `${PREFIX} Client`, "LS1 4DY");

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

/**
 * The office postcode is a precondition, not an option.
 *
 * With none set, getStaffOriginPostcode returns an empty string and the engine
 * used to plan a day starting from nowhere: no travel to the first visit, no
 * Share button, and nothing on screen to say that a blank field on a different
 * page was the cause. It is refused explicitly now, and the field lives on the
 * Setup tab where the round is built.
 */
test.describe("Missing office postcode", () => {
  test("is refused with an explanation rather than planned from nowhere", async ({
    page,
  }) => {
    await setOfficePostcode(page, "");

    await page.goto("/scheduler");
    await expect(page).not.toHaveURL(/\/login/);
    await page.waitForTimeout(2500);
    await clearWorkspace(page);

    await addStaff(page, `${PREFIX} Carer`, "LS1 1UR");
    await addAppointment(page, `${PREFIX} Client`, "LS1 4DY");

    // The Setup card should already be flagging it before anything is pressed.
    await expect(
      page.getByText(/Set this before generating/i),
      "the missing value should be visible where the round is built"
    ).toBeVisible();

    await page.getByRole("button", { name: /generate schedule/i }).first().click();
    await page.waitForTimeout(4000);

    await expect(
      page.getByText(/nowhere for anyone.s day to start/i),
      "generating should explain the problem, not produce an originless round"
    ).toBeVisible();

    await clearWorkspace(page);
    await setOfficePostcode(page, "LS1 1UR");
  });
});
