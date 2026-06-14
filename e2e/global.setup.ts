import { test as setup } from "@playwright/test";
import path from "path";
import fs from "fs";

const authFile = path.join(__dirname, ".auth/user.json");

setup("sign in as pro user", async ({ page }) => {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Set TEST_USER_EMAIL and TEST_USER_PASSWORD in .env.local before running Playwright tests."
    );
  }

  await page.goto("/login");

  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);

  // Start listening for URL change before clicking, then click
  await Promise.all([
    page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15_000 }),
    page.click('button[type="submit"]'),
  ]);

  // Let the landing page settle (Supabase writes cookies/localStorage async)
  await page.waitForLoadState("domcontentloaded");

  fs.mkdirSync(path.dirname(authFile), { recursive: true });
  await page.context().storageState({ path: authFile });

  console.log("✅ Signed in, auth state saved to", authFile);
});
