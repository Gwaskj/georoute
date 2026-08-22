import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Automated accessibility checks.
 *
 * axe finds roughly a third of WCAG issues -- it cannot judge whether alt text
 * is meaningful or whether a flow makes sense with a screen reader. So a clean
 * run here is a floor, not a certificate, and the accessibility statement says
 * as much rather than claiming conformance this suite cannot evidence.
 *
 * Serious and critical only. Axe's "minor" and "moderate" buckets include
 * advisory rules that would make this fail on aesthetics rather than on
 * anything a person is blocked by.
 */
const PAGES = [
  ["home", "/"],
  ["pricing", "/pricing"],
  ["how it works", "/how-it-works"],
  ["help hub", "/help"],
  ["help guide", "/help/getting-started"],
  ["sector page", "/care-planning"],
  ["privacy", "/privacy"],
  ["terms", "/terms"],
  ["security", "/security"],
  ["accessibility", "/accessibility"],
  ["login", "/login"],
  ["my round (empty)", "/my-round"],
] as const;

for (const [name, path] of PAGES) {
  test(`${name} has no serious accessibility violations`, async ({ page }) => {
    await page.goto(path);
    await page.waitForTimeout(1500);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const serious = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical"
    );

    if (serious.length) {
      console.log(`\n[${path}]`);
      for (const v of serious) {
        console.log(`  ${v.impact}: ${v.id} — ${v.help}`);
        for (const node of v.nodes.slice(0, 3)) {
          console.log(`      ${node.html.slice(0, 120)}`);
        }
      }
    }

    expect(
      serious.map((v) => `${v.impact}: ${v.id}`),
      "serious or critical accessibility violations"
    ).toEqual([]);
  });
}

/**
 * The results list, which the page-level sweep above cannot reach.
 *
 * It only exists once a schedule has been generated, so it needs the whole
 * setup flow. Worth the 45 seconds: this list was the site's worst
 * accessibility problem -- the entire card was one control with the round's
 * own buttons nested inside it -- and a regression would be invisible from the
 * outside.
 */
test.describe("Results list disclosure", () => {
  test.setTimeout(180_000);

  test("expands from the keyboard and nests no controls", async ({ page }) => {
    const PREFIX = "E2E-A11Y";
    page.on("dialog", (d) => d.accept().catch(() => {}));

    await page.goto("/settings");
    await page.waitForTimeout(2000);
    await page.locator('input[placeholder="e.g. SW1A 1AA"]').first().fill("LS1 1UR");
    await page.getByRole("button", { name: /save/i }).first().click();
    await page.waitForTimeout(1200);

    await page.goto("/scheduler");
    await page.waitForTimeout(2000);
    for (let i = 0; i < 3; i++) {
      const clear = page.getByRole("button", { name: "Clear all", exact: true });
      if ((await clear.count()) === 0) break;
      await clear.first().click().catch(() => {});
      await page.waitForTimeout(1200);
    }

    await page.getByRole("button", { name: "Add staff", exact: true }).first().click();
    await page.waitForTimeout(1200);
    await page.locator("input[type=text]").nth(0).fill(`${PREFIX} Carer`);
    await page.locator("input[type=text]").nth(1).fill("LS1 1UR");
    await page.getByRole("button", { name: "Add", exact: true }).first().click();
    await page.waitForTimeout(1500);

    await page.getByRole("button", { name: "Add appointment", exact: true }).first().click();
    await page.waitForTimeout(1200);
    const text = page.locator("input[type=text]");
    await text.nth(0).fill(`${PREFIX} Client`);
    await text.nth(3).fill("LS1 4DY");
    await page.locator("input[type=number]").nth(0).fill("30");
    await page.getByRole("button", { name: "Add", exact: true }).first().click();
    await page.waitForTimeout(1500);

    await page.getByRole("button", { name: /generate schedule/i }).first().click();
    await page.waitForTimeout(28000);
    await page.getByRole("button", { name: "Results", exact: true }).click();
    await expect(page.getByText("Staff results")).toBeVisible();

    const summary = page
      .locator('button[aria-controls^="staff-round-"]')
      .first();
    await expect(summary, "the row should be a real button").toBeVisible();
    await expect(summary).toHaveAttribute("aria-expanded", "false");

    // Space, which a div with role="button" does not handle without extra code.
    await summary.focus();
    await page.keyboard.press("Space");
    await page.waitForTimeout(1200);
    await expect(
      summary,
      "space should open the round and the state should be announced"
    ).toHaveAttribute("aria-expanded", "true");

    // The round is a sibling of the control, not a child of it.
    expect(
      await summary.locator("button, a").count(),
      "no controls may be nested inside the disclosure button"
    ).toBe(0);

    await expect(
      page.getByRole("button", { name: "Share with staff", exact: true })
    ).toBeVisible();

    await page.keyboard.press("Space");
    await page.waitForTimeout(1000);
    await expect(summary).toHaveAttribute("aria-expanded", "false");

    for (let i = 0; i < 3; i++) {
      const clear = page.getByRole("button", { name: "Clear all", exact: true });
      if ((await clear.count()) === 0) break;
      await clear.first().click().catch(() => {});
      await page.waitForTimeout(1200);
    }
  });
});
