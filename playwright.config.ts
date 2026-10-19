import { defineConfig } from "@playwright/test";
import { ADMIN, BASE, PORT, env } from "./e2e/env";

// End-to-end tests against the real Supabase project (rows are created by two test users and removed afterwards).
// Run: npm run build && npm run test:e2e
export default defineConfig({
  testDir: "e2e",
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  use: {
    baseURL: BASE,
    channel: "chrome", // installed Google Chrome, no browser download
    // proxy.ts blocks "HeadlessChrome" user agents
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36",
    locale: "th-TH",
    trace: "retain-on-failure",
  },
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `${BASE}/th`,
    reuseExistingServer: false,
    stdout: "pipe",
    stderr: "pipe",
    timeout: 120_000,
    env: {
      ...env,
      // test server only: the e2e admin account, and Cloudflare's documented always-pass Turnstile test keys
      ADMIN_EMAILS: `${env.ADMIN_EMAILS},${ADMIN}`,
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
      TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
      NEXT_PUBLIC_SITE_URL: BASE,
    },
  },
});
