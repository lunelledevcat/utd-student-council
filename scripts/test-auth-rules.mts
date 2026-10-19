// Sign-in / role rules (lib/env.ts) — the same functions getSession() and /auth/callback use.
// Run: node scripts/test-auth-rules.mts   (Node >= 23 runs TypeScript directly)
import assert from "node:assert/strict";

process.env.ALLOWED_EMAIL_DOMAIN = "utd.ac.th";
process.env.ADMIN_EMAILS = " Lunelle.Dev@gmail.com , other.admin@utd.ac.th";
const { canSignIn, roleFor } = await import("../lib/env.ts");

/** Where the app sends a person after Google sign-in (mirrors /auth/callback + requireRole). */
const destination = (email: string, verified: boolean, storedRole: string | null) =>
  !canSignIn(email, verified) ? "/login?error=domain" : roleFor(email, storedRole) === "admin" ? "/admin" : roleFor(email, storedRole) ? "/dashboard" : "/pending-access";

const cases: [string, boolean, string | null, string][] = [
  ["lunelle.dev@gmail.com", true, null, "/admin"], //            admin outside the school domain
  ["  LUNELLE.DEV@GMAIL.COM ", true, null, "/admin"], //         trimmed + case-insensitive
  ["lunelle.dev@gmail.com", false, null, "/login?error=domain"], // Google did not verify the address
  ["someone.else@gmail.com", true, null, "/login?error=domain"], // other gmail -> bounced
  ["student@utd.ac.th", true, null, "/pending-access"], //       school address, no role yet
  ["student@utd.ac.th", true, "council", "/dashboard"],
  ["teacher@utd.ac.th", true, "teacher", "/dashboard"],
  ["student@utd.ac.th", true, "admin", "/pending-access"], //    a stored "admin" is ignored: only ADMIN_EMAILS grants admin
  ["x@utd.ac.th.evil.com", true, null, "/login?error=domain"],
  ["a@b@utd.ac.th", true, null, "/login?error=domain"],
];
for (const [email, verified, role, want] of cases) {
  assert.equal(destination(email, verified, role), want, `${JSON.stringify(email)} verified=${verified} role=${role}`);
}
console.log(`auth rules ok — ${cases.length} cases`);
