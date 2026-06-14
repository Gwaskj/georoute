const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const consoleErrors = [];
  const networkErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      consoleErrors.push(`[${msg.type().toUpperCase()}] ${msg.text()}`);
    }
  });

  page.on('response', resp => {
    const url = resp.url();
    if (!resp.ok() && !url.includes('favicon') && !url.includes('_next/static') && !url.includes('pagead')) {
      networkErrors.push(`${resp.status()} ${url}`);
    }
  });

  page.on('pageerror', err => {
    consoleErrors.push(`[PAGE ERROR] ${err.message}`);
  });

  try {
    await page.goto('http://localhost:3000/scheduler', { waitUntil: 'networkidle', timeout: 30000 });
  } catch(e) {
    console.log('Navigation note:', e.message);
  }

  await page.waitForTimeout(5000);
  await page.screenshot({ path: './test-scheduler.png', fullPage: true });

  const h1 = await page.$eval('h1', el => el.textContent).catch(() => 'no h1');
  const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 1000));

  console.log('=== H1 ===\n' + h1);
  console.log('\n=== BODY ===\n' + bodyText);
  console.log('\n=== CONSOLE ERRORS/WARNINGS (' + consoleErrors.length + ') ===');
  consoleErrors.slice(0, 30).forEach(e => console.log(e));
  console.log('\n=== NETWORK ERRORS (' + networkErrors.length + ') ===');
  networkErrors.forEach(e => console.log(e));

  await browser.close();
})();
