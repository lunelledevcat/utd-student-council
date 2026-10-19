// Test-only environment. The app under test runs on workerd (`wrangler dev` on the OpenNext build) with its own
// local D1 / R2 / KV in e2e/.state (wiped every run), so tests never touch production data.
export const PORT = 3100;
export const BASE = `http://localhost:${PORT}`;
export const STATE = "e2e/.state";
export const VARS = "e2e/.auth/e2e.vars";
// Test accounts. The admin is admin through ADMIN_EMAILS of the test server; the council member through users.role.
export const ADMIN = "e2e-admin@utd.ac.th";
export const COUNCIL = "e2e-council@utd.ac.th";
export const ADMIN_ID = "00000000-0000-4000-8000-00000000ad01";
export const COUNCIL_ID = "00000000-0000-4000-8000-00000000c001";
export const TAG = "[E2E]"; // every row the tests create starts with this
