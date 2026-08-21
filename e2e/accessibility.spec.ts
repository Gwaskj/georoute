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
