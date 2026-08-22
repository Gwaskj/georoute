import { test, expect } from "@playwright/test";
import { addStaff } from "./workspace";
import fs from "fs";
import path from "path";
import os from "os";

/**
 * Saving a workspace to a file and restoring it.
 *
 * This is the only route back from a cleared browser, and the only way to move
 * a workspace between computers, because nothing is kept on our servers. It is
 * also what the privacy policy, the terms and two help guides now tell people
 * exists, so it failing quietly would make all of them untrue.
 *
 * The download-and-restore path is tested rather than the File System Access
 * one: the latter opens a native file picker that Playwright cannot drive, and
 * both write the same bytes through the same export.
 */
test.setTimeout(180_000);

test("a workspace survives a download, a wipe and a restore", async ({ page }) => {
  const PREFIX = "E2E-BACKUP";
  page.on("dialog", (d) => d.accept().catch(() => {}));

  await page.goto("/scheduler");
  await expect(page).not.toHaveURL(/\/login/);
  await page.waitForTimeout(2000);

  for (let i = 0; i < 3; i++) {
    const clear = page.getByRole("button", { name: "Clear all", exact: true });
    if ((await clear.count()) === 0) break;
    await clear.first().click().catch(() => {});
    await page.waitForTimeout(1200);
  }

  await addStaff(page, `${PREFIX} Carer`, "LS1 1UR");

  // Download the workspace.
  await page.goto("/settings");
  await page.waitForTimeout(2500);
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Download a copy" }).click(),
  ]);
  const file = path.join(os.tmpdir(), `georoutes-e2e-${Date.now()}.json`);
  await download.saveAs(file);

  const saved = JSON.parse(fs.readFileSync(file, "utf8"));
  expect(saved.data.staff.map((s: { name: string }) => s.name)).toContain(
    `${PREFIX} Carer`
  );

  // Wipe it, the way clearing browsing data would.
  await page.goto("/scheduler");
  await page.waitForTimeout(2000);
  for (let i = 0; i < 3; i++) {
    const clear = page.getByRole("button", { name: "Clear all", exact: true });
    if ((await clear.count()) === 0) break;
    await clear.first().click().catch(() => {});
    await page.waitForTimeout(1200);
  }
  await expect(page.getByText(`${PREFIX} Carer`)).toHaveCount(0);

  // Restore from the file.
  await page.goto("/settings");
  await page.waitForTimeout(2500);
  await page.setInputFiles('input[type="file"][accept*="json"]', file);
  await page.waitForTimeout(2500);

  await page.goto("/scheduler");
  await page.waitForTimeout(2500);
  await expect(
    page.getByText(`${PREFIX} Carer`).first(),
    "the staff member should come back from the file"
  ).toBeVisible();

  fs.unlinkSync(file);

  for (let i = 0; i < 3; i++) {
    const clear = page.getByRole("button", { name: "Clear all", exact: true });
    if ((await clear.count()) === 0) break;
    await clear.first().click().catch(() => {});
    await page.waitForTimeout(1200);
  }
});
