const { chromium } = require('playwright');

// Read .env.local for Supabase URL to confirm we can see auth flows
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleErrors = [];
  const networkErrors = [];

  page.on('console', msg => {
    const type = msg.type();
    if (type === 'error' || type === 'warning') {
      const text = msg.text();
      // Skip known noise
      if (text.includes('AdSense') || text.includes('data-nscript')) return;
      consoleErrors.push(`[${type.toUpperCase()}] ${text}`);
    }
  });

  page.on('response', resp => {
    const url = resp.url();
    if (!resp.ok() && !url.includes('favicon') && !url.includes('_next/static') && !url.includes('pagead') && !url.includes('googlesyndication')) {
      networkErrors.push(`${resp.status()} ${resp.url()}`);
    }
  });

  page.on('pageerror', err => {
    consoleErrors.push(`[PAGE ERROR] ${err.message}`);
  });

  // First visit login page and capture what it looks like
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 15000 }).catch(e => {});
  await page.waitForTimeout(2000);
  await page.screenshot({ path: './test-login.png', fullPage: true });
  console.log('Login page body:', (await page.evaluate(() => document.body.innerText.slice(0, 300))));

  // Now go directly to scheduler (unauthenticated) and look for any runtime errors
  await page.goto('http://localhost:3000/scheduler', { waitUntil: 'networkidle', timeout: 15000 }).catch(e => {});
  await page.waitForTimeout(4000);

  // Interact: try clicking Add appointment
  const addBtn = await page.$('button:has-text("Add appointment")');
  if (addBtn) {
    await addBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: './test-add-appointment.png', fullPage: true });
    console.log('\nClicked Add appointment — modal visible:', await page.$('.modal-overlay') !== null);
    // Close modal
    const cancelBtn = await page.$('button:has-text("Cancel")');
    if (cancelBtn) await cancelBtn.click();
  }

  // Try Add staff
  const addStaffBtn = await page.$('button:has-text("Add staff")');
  if (addStaffBtn) {
    await addStaffBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: './test-add-staff.png', fullPage: true });
    console.log('Clicked Add staff — modal visible:', await page.$('.modal-overlay') !== null);
    const cancelBtn = await page.$('button:has-text("Cancel")');
    if (cancelBtn) await cancelBtn.click();
  }

  await page.waitForTimeout(2000);

  console.log('\n=== CONSOLE ERRORS/WARNINGS (' + consoleErrors.length + ') ===');
  consoleErrors.slice(0, 40).forEach(e => console.log(e));
  console.log('\n=== NETWORK ERRORS (' + networkErrors.length + ') ===');
  networkErrors.forEach(e => console.log(e));

  await browser.close();
})();
