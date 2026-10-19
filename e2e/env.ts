// Test-only environment: reads .env.local (never printed) and defines the two test accounts.
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const env: Record<string, string> = {
  ...Object.fromEntries(
    readFileSync(join(process.cwd(), ".env.local"), "utf8").split(/\r?\n/)
      .filter((l) => /^[A-Z0-9_]+=/.test(l))
      .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]),
  ),
};

export const PORT = 3100;
export const BASE = `http://localhost:${PORT}`;
// Test accounts on the school domain. The admin is granted only through ADMIN_EMAILS of the *test* server
// (playwright.config.ts); the council member through profiles.role. Both are removed again in global teardown.
export const ADMIN = "e2e-admin@utd.ac.th";
export const COUNCIL = "e2e-council@utd.ac.th";
export const TAG = "[E2E]"; // every row the tests create starts with this, teardown deletes by author anyway
