import { test, expect } from "@playwright/test";

/**
 * The header must not make the page scroll sideways.
 *
 * The bar is filled from the header editor, so it grows whenever a page is
 * added to it. With nine items it overflowed between 768px and 1024px -- a
 * common laptop and tablet range -- because the navigation collapsed to the
 * menu button only below 768px. Horizontal scrolling is the symptom nobody
 * reports and everybody notices.
 */
test.setTimeout(120_000);

const WIDTHS = [1440, 1280, 1100, 1024, 900, 820, 768, 640, 390, 320];

test("the header fits at every width", async ({ page }) => {
  const bad: string[] = [];

  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 400 });
    await page.goto("/");
    await page.waitForTimeout(1200);

    const overflows = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth
    );
    if (overflows) bad.push(`${width}px`);
  }

  expect(bad, `the page scrolls sideways at: ${bad.join(", ")}`).toEqual([]);
});
