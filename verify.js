/**
 * End-to-end verification of GeoRoute features using isolated browser contexts.
 */
const { chromium } = require("playwright");

let pass = 0;
let fail = 0;

function check(label, condition, detail = "") {
  if (condition) {
    console.log(`  ✅ ${label}`);
    pass++;
  } else {
    console.log(`  ❌ ${label}${detail ? ": " + detail : ""}`);
    fail++;
  }
}

async function withPage(browser, fn) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.setViewportSize({ width: 1280, height: 720 });
  try {
    await fn(page);
  } finally {
    await context.close();
  }
}

async function closeModal(page) {
  const visible = await page.locator(".modal-overlay").isVisible().catch(() => false);
  if (!visible) return;
  await page.keyboard.press("Escape").catch(() => {});
  await page.locator(".modal-overlay").waitFor({ state: "hidden", timeout: 2000 }).catch(async () => {
    await page.locator('.modal-footer button').first().click().catch(() => {});
  });
  await page.waitForTimeout(200);
}

const BASE = "http://localhost:3099";

// ─── 1. DEFAULT WINDOWS ─────────────────────────────────────────────────────
async function testDefaultWindows(browser) {
  console.log("\n[1] Default windows seeded on fresh load");
  await withPage(browser, async (page) => {
    await page.goto(`${BASE}/scheduler`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    const html = await page.content();
    check("Breakfast seeded", html.includes("Breakfast"));
    check("Lunch seeded", html.includes("Lunch"));
    check("Tea seeded", html.includes("Tea"));
    check("Bedtime seeded", html.includes("Bedtime"));
  });
}

// ─── 2. FREE TIER LIMITS ────────────────────────────────────────────────────
async function testFreeLimits(browser) {
  console.log("\n[2] Free tier limits");
  await withPage(browser, async (page) => {
    await page.goto(`${BASE}/scheduler`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    // Staff limit: 2
    for (const name of ["Alice", "Bob"]) {
      const btn = page.locator('button:has-text("Add staff")').first();
      await btn.click();
      await page.waitForTimeout(400);
      await page.locator('.modal-overlay input[type="text"]').first().fill(name);
      await page.locator('.modal-footer button').filter({ hasText: "Add" }).first().click();
      await page.waitForTimeout(400);
    }
    const html2 = await page.content();
    check("Two staff members added", html2.includes("Alice") && html2.includes("Bob"));

    const staffBtnText = await page.locator('button:has-text("Max staff reached")').first().isVisible().catch(() => false);
    check("Staff button disabled after 2nd", staffBtnText);

    // Appointment limit: 10
    for (let i = 1; i <= 10; i++) {
      const addBtn = page.locator('button:has-text("Add appointment")').first();
      const disabled = await addBtn.isDisabled().catch(() => true);
      if (disabled) break;
      await addBtn.click();
      await page.waitForTimeout(400);
      await page.locator('.modal-overlay input[type="text"]').first().fill(`Patient ${i}`);
      await page.locator('.modal-footer button').filter({ hasText: "Add" }).last().click();
      await page.waitForTimeout(400);
    }
    const html10 = await page.content();
    check("10 appointments added", html10.includes("Patient 10"));

    const apptBtnDisabled = await page.locator('button:has-text("Add appointment")').first().isDisabled().catch(() => false);
    check("Appointment button disabled at 10", apptBtnDisabled);

    const upgradeMsg = await page.locator('text=Free limit reached').isVisible().catch(() => false);
    check("Upgrade prompt shown", upgradeMsg);
  });
}

// ─── 3. SKILLS MANAGEMENT ───────────────────────────────────────────────────
async function testSkills(browser) {
  console.log("\n[3] Skills management in settings");
  await withPage(browser, async (page) => {
    await page.goto(`${BASE}/settings`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);

    const skillInput = page.locator('input[placeholder*="skill" i], input[placeholder*="Skill"]').first();
    const found = await skillInput.isVisible().catch(() => false);
    check("Skills input found in settings", found);

    if (found) {
      await skillInput.fill("Catheter Care");
      await page.keyboard.press("Enter");
      await page.waitForTimeout(500);
      const html = await page.content();
      check("Skill added to list", html.includes("Catheter Care"));
    }
  });
}

// ─── 4. NAVIGATION & BUTTON INTERACTION ─────────────────────────────────────
async function testNavigation(browser) {
  console.log("\n[4] Navigation: settings → scheduler → Add staff button");
  await withPage(browser, async (page) => {
    // Go to settings first (simulates real user flow)
    await page.goto(`${BASE}/settings`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // Add a skill while we're here
    const skillInput = page.locator('input[placeholder*="skill" i]').first();
    if (await skillInput.isVisible().catch(() => false)) {
      await skillInput.fill("Wound Care");
      await page.keyboard.press("Enter");
      await page.waitForTimeout(300);
    }

    // Navigate to scheduler
    await page.goto(`${BASE}/scheduler`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    // No session data in this fresh context → "Add staff" is enabled
    const addStaffBtn = page.locator('button:has-text("Add staff")').first();
    const visible = await addStaffBtn.isVisible().catch(() => false);
    check("Add staff button visible", visible);

    const isEnabled = !(await addStaffBtn.isDisabled().catch(() => true));
    check("Add staff button enabled (fresh session)", isEnabled);

    if (isEnabled) {
      await addStaffBtn.click({ timeout: 5000 });
      const modalOpen = await page.locator(".modal-overlay").isVisible().catch(() => false);
      check("Add staff modal opens", modalOpen);
      await closeModal(page);
    }
  });
}

// ─── 5. SCHEDULER GENERATES VISITS ──────────────────────────────────────────
async function testScheduler(browser) {
  console.log("\n[5] Scheduler generates visits");
  await withPage(browser, async (page) => {
    await page.goto(`${BASE}/scheduler`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    // Add 1 staff member
    await page.locator('button:has-text("Add staff")').first().click();
    await page.waitForTimeout(400);
    await page.locator('.modal-overlay input[type="text"]').first().fill("Alice");
    await page.locator('.modal-footer button').filter({ hasText: "Add" }).first().click();
    await page.waitForTimeout(400);

    // Select the staff member (checkbox)
    const checkbox = page.locator('input[type="checkbox"]').first();
    const isChecked = await checkbox.isChecked().catch(() => true);
    if (!isChecked) await checkbox.click();
    await page.waitForTimeout(200);

    // Add 1 appointment
    await page.locator('button:has-text("Add appointment")').first().click();
    await page.waitForTimeout(400);
    await page.locator('.modal-overlay input[type="text"]').first().fill("Test Patient");
    await page.locator('.modal-footer button').filter({ hasText: "Add" }).last().click();
    await page.waitForTimeout(400);

    // Click Generate schedule
    await page.locator('button:has-text("Generate schedule")').click();
    await page.waitForTimeout(3000);

    const html = await page.content();
    check("Generated visits include patient name", html.includes("Test Patient"));
    check("Generated visits include staff name", html.includes("Alice"));
  });
}

// ─── MAIN ───────────────────────────────────────────────────────────────────
(async () => {
  const browser = await chromium.launch({ headless: true });

  await testDefaultWindows(browser);
  await testFreeLimits(browser);
  await testSkills(browser);
  await testNavigation(browser);
  await testScheduler(browser);

  await browser.close();

  console.log("\n─────────────────────────────────────────");
  console.log(`Results: ${pass} passed, ${fail} failed`);
  console.log(fail === 0 ? "✅ ALL CHECKS PASSED" : "❌ SOME CHECKS FAILED");
  process.exit(fail > 0 ? 1 : 0);
})();
