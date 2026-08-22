import type { Page } from "@playwright/test";

/**
 * Setting up a workspace, for tests that need data before they can start.
 *
 * These steps used to be copied into four spec files and addressed fields by
 * position -- `input[type=text]` index 0 for the staff name, index 1 for the
 * postcode. That held only while nothing else on the page had a text input,
 * so adding the office postcode to the Setup tab silently pushed every index
 * along by one and a test filled "LS1 1UR" into the name field. It failed on
 * an assertion three steps later, about something else entirely.
 *
 * Addressed by id now, which the form controls gained when their labels were
 * properly associated. A field moving no longer moves anything else.
 */

export async function clearWorkspace(page: Page): Promise<void> {
  // Confirm dialogs must be handled before the click that raises them.
  page.on("dialog", (d) => d.accept().catch(() => {}));
  for (let round = 0; round < 3; round++) {
    const clear = page.getByRole("button", { name: "Clear all", exact: true });
    if ((await clear.count()) === 0) break;
    await clear.first().click().catch(() => {});
    await page.waitForTimeout(1200);
  }
}

/** The office postcode, without which nobody has anywhere to start from. */
export async function setOfficePostcode(page: Page, postcode: string): Promise<void> {
  await page.goto("/scheduler");
  await page.waitForTimeout(2000);
  const field = page.locator("#setup-office-postcode");
  await field.fill(postcode);
  await field.blur();
  await page.waitForTimeout(1200);
}

export async function addStaff(
  page: Page,
  name: string,
  homePostcode: string
): Promise<void> {
  await page.getByRole("button", { name: "Add staff", exact: true }).first().click();
  await page.waitForTimeout(1200);
  await page.locator("#addstaff-name").fill(name);
  await page.locator("#addstaff-home-postcode").fill(homePostcode);
  await page.getByRole("button", { name: "Add", exact: true }).first().click();
  await page.waitForTimeout(1500);
}

export async function addAppointment(
  page: Page,
  name: string,
  postcode: string,
  minutes = 30
): Promise<void> {
  await page
    .getByRole("button", { name: "Add appointment", exact: true })
    .first()
    .click();
  await page.waitForTimeout(1200);
  await page.locator("#addappointment-name").fill(name);
  await page.locator("#addappointment-postcode").fill(postcode);
  await page.locator("#addappointment-duration-minutes").fill(String(minutes));
  await page.getByRole("button", { name: "Add", exact: true }).first().click();
  await page.waitForTimeout(1500);
}
