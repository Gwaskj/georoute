import { test, expect, type Page } from "@playwright/test";
import { addStaff, addAppointment, setOfficePostcode } from "./workspace";

/**
 * The behaviour that replaced the database.
 *
 * Three claims underpin the whole change, and none of them was covered by the
 * existing suite:
 *
 *   1. Data entered in a browser is still there after a reload, because there
 *      is no server copy to fall back on any more.
 *   2. A round link carries the round in its fragment, so someone with no
 *      account and no session can open it -- and the server never sees it.
 *   3. Nothing about a round reaches the network.
 *
 * The third is the one that matters legally, so it is asserted directly rather
 * than inferred from the design.
 */

const PREFIX = "E2E-LOCAL";

test.setTimeout(120_000);

async function clearWorkspace(page: Page) {
  page.on("dialog", (d) => d.accept().catch(() => {}));
  for (let round = 0; round < 3; round++) {
    const clear = page.getByRole("button", { name: "Clear all", exact: true });
    if ((await clear.count()) === 0) break;
    await clear.first().click().catch(() => {});
    await page.waitForTimeout(1200);
  }
}

async function addStaffAndAppointment(page: Page) {
  await addStaff(page, `${PREFIX} Carer`, "LS1 1UR");

  await addAppointment(page, `${PREFIX} Client`, "LS1 4DY");
}

test.describe("Data kept in the browser", () => {
  test("staff and appointments survive a reload", async ({ page }) => {
    await page.goto("/scheduler");
    await expect(page).not.toHaveURL(/\/login/);
    await page.waitForTimeout(2000);
    await clearWorkspace(page);

    await addStaffAndAppointment(page);
    await expect(page.getByText(`${PREFIX} Carer`).first()).toBeVisible();

    // The point of moving off sessionStorage: this used to come back empty.
    await page.reload();
    await page.waitForTimeout(2500);

    await expect(
      page.getByText(`${PREFIX} Carer`).first(),
      "staff should still be here after a reload"
    ).toBeVisible();
    await expect(
      page.getByText(`${PREFIX} Client`).first(),
      "appointments should still be here after a reload"
    ).toBeVisible();

    await clearWorkspace(page);
  });

  test("nothing about a round is sent to the server", async ({ page }) => {
    // Every request the page makes, so a leak shows up as evidence rather
    // than as an argument about how fragments work.
    const sent: string[] = [];
    page.on("request", (req) => sent.push(`${req.method()} ${req.url()}`));

    await page.goto("/scheduler");
    await expect(page).not.toHaveURL(/\/login/);
    await page.waitForTimeout(2000);
    await clearWorkspace(page);

    await addStaffAndAppointment(page);
    await page.waitForTimeout(1500);

    const leaked = sent.filter(
      (r) => r.includes(PREFIX) || r.includes(encodeURIComponent(PREFIX))
    );
    expect(
      leaked,
      `client and staff names must never appear in a request:\n${leaked.join("\n")}`
    ).toHaveLength(0);

    // The tables are gone, so a request to them would 404 rather than leak --
    // but a request at all would mean code still reaching for them.
    const doomed = sent.filter((r) =>
      /\/rest\/v1\/(staff|appointments|scheduled_visits|routes|shared_schedules|user_windows|user_skills|appointment_exceptions|business_settings)\b/.test(r)
    );
    expect(
      doomed,
      `nothing should query the dropped tables:\n${doomed.join("\n")}`
    ).toHaveLength(0);

    await clearWorkspace(page);
  });
});

test.describe("Round links", () => {
  test("explains itself when opened with no round", async ({ page }) => {
    await page.goto("/my-round");
    await expect(page.getByText(/No round in this link/i)).toBeVisible();
  });

  test("says so when the link is truncated", async ({ page }) => {
    await page.goto("/my-round#1thisisnotavalidroundpayload");
    await expect(page.getByText(/could not be read/i)).toBeVisible();
  });

  test("a carer with no account can open the round", async ({ page, browser }) => {
    // The office postcode has to be set for a round to have a start: with no
    // origin there is nowhere to navigate from, and generating is refused.
    // Set on the Setup tab, which is where it now lives.
    await setOfficePostcode(page, "LS1 1UR");

    await page.goto("/scheduler");
    await expect(page).not.toHaveURL(/\/login/);
    await page.waitForTimeout(2000);
    await clearWorkspace(page);

    await addStaffAndAppointment(page);

    await page.getByRole("button", { name: /generate schedule/i }).first().click();
    await page.waitForTimeout(28000);

    await page.getByRole("button", { name: "Results", exact: true }).click();
    await expect(page.getByText("Staff results")).toBeVisible();

    // The round, and its share button, only open up once the carer is
    // selected -- the list shows a summary per person until then.
    await page.getByText(`${PREFIX} Carer`).first().click();
    await page.waitForTimeout(1500);

    // Exact, and not .first(). The staff row is a div with role="button" whose
    // accessible name is the whole of its text -- which contains "Share with
    // staff" once expanded -- so a loose match finds the row before the button
    // and clicking it collapses the round instead of sharing it.
    const share = page.getByRole("button", { name: "Share with staff", exact: true });
    await expect(share, "the round should be shareable").toBeVisible();
    await share.click();

    const linkBox = page.locator('input[readonly]').first();
    await expect(linkBox, "a link should appear").toBeVisible({ timeout: 15_000 });
    const link = await linkBox.inputValue();
    expect(link, "the round should travel in the fragment").toContain("/my-round#");

    // A fresh context: no cookies, no session, no IndexedDB. This is a carer
    // on their own phone who has never signed in to anything.
    const carer = await browser.newContext();
    const carerPage = await carer.newPage();

    const carerRequests: string[] = [];
    carerPage.on("request", (req) => carerRequests.push(req.url()));

    await carerPage.goto(link);
    await carerPage.waitForTimeout(2500);

    await expect(
      carerPage.getByText(`${PREFIX} Client`).first(),
      "the carer should see the visit without signing in"
    ).toBeVisible();
    await expect(carerPage).not.toHaveURL(/\/login/);

    // The fragment must not appear in anything the browser sent.
    const fragment = link.split("#")[1];
    const leaked = carerRequests.filter((u) => u.includes(fragment.slice(0, 32)));
    expect(
      leaked,
      `the round must never be transmitted:\n${leaked.join("\n")}`
    ).toHaveLength(0);

    await carer.close();

    await page.getByRole("button", { name: "Setup", exact: true }).click();
    await page.waitForTimeout(1200);
    await clearWorkspace(page);
  });
});
