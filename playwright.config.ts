import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, ".env.local") });

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "list",
  use: {
    // Overridable so the same suite can be pointed at the Cloudflare Workers
    // preview (`npm run cf:preview`, port 8788) as well as `next start`.
    // Running it against both is the only way to catch behaviour that differs
    // between the Node and workerd runtimes.
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3000",
    trace: "off",
    extraHTTPHeaders: {
      "accept-encoding": "identity",
    },
  },
  projects: [
    // 1. Sign in and save storage state
    {
      name: "setup",
      testMatch: /global\.setup\.ts/,
    },
    // 2. All other tests reuse the saved session
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/user.json",
      },
      dependencies: ["setup"],
    },
  ],
});
