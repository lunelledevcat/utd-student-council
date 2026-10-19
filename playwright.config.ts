import { defineConfig } from "@playwright/test";
import { BASE, PORT, STATE, VARS } from "./e2e/env";

// End-to-end tests against the OpenNext build running on workerd (`wrangler dev`) with local D1/R2/KV in e2e/.state.
// Run: npm run test:e2e (builds, resets e2e/.state, applies migrations, writes test vars, then runs Playwright).
export default defineConfig({
  testDir: "e2e",
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: BASE,
    channel: "chrome", // installed Google Chrome, no browser download
    // proxy.ts blocks "HeadlessChrome" user agents
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36",
    locale: "th-TH",
    trace: "retain-on-failure",
  },
  webServer: {
    command: `npx wrangler dev --port ${PORT} --ip 127.0.0.1 --local --persist-to ${STATE} --env-file ${VARS} --show-interactive-dev-session=false`,
    url: `${BASE}/th`,
    reuseExistingServer: false,
    stdout: "pipe",
    stderr: "pipe",
    timeout: 120_000,
  },
});
