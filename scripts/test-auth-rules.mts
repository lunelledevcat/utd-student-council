// Sign-in / role decision (lib/env.ts decideAccess) — the same function /auth/callback and getSession() use.
// Order: not verified / malformed -> denied · ADMIN_EMAILS -> admin · active allowed_users row -> its role ·
// other @ALLOWED_EMAIL_DOMAIN -> pending (/pending-access) · anything else -> denied.
// Run: npm run test:auth   (Node >= 23 runs TypeScript directly)
import assert from "node:assert/strict";

process.env.ALLOWED_EMAIL_DOMAIN = "utd.ac.th";
process.env.ADMIN_EMAILS = " Site.Admin@gmail.com , other.admin@utd.ac.th";
process.env.COUNCIL_EMAILS = " Shared.Council@utd.ac.th:shared , member@utd.ac.th ";
const { decideAccess, councilEmails, normalizeEmail } = await import("../lib/env.ts");

/** Where the app sends a person after Google sign-in (mirrors /auth/callback + requireRole). */
const destination = (email: string, verified: boolean, row: { role: string; active: boolean } | null) => {
  const a = decideAccess(email, verified, row);
  return a === "denied" ? "/login?error=domain" : a === "pending" ? "/pending-access" : a === "admin" ? "/admin" : `/dashboard (${a})`;
};
const council = { role: "council", active: true };
const teacher = { role: "teacher", active: true };
const off = { role: "council", active: false };

const cases: [string, boolean, { role: string; active: boolean } | null, string][] = [
  // 1. Google must have verified the address; malformed addresses never pass
  ["site.admin@gmail.com", false, null, "/login?error=domain"],
  ["council@utd.ac.th", false, council, "/login?error=domain"],
  ["a@b@utd.ac.th", true, council, "/login?error=domain"],
  ["", true, null, "/login?error=domain"],
  // 2. ADMIN_EMAILS wins over everything (also outside the domain, trimmed + case-insensitive)
  ["site.admin@gmail.com", true, null, "/admin"],
  ["  SITE.ADMIN@GMAIL.COM ", true, null, "/admin"],
  ["other.admin@utd.ac.th", true, council, "/admin"],
  // 3. an active allowed_users row gives its role (the council's shared address, a teacher)
  ["shared.council@utd.ac.th", true, council, "/dashboard (council)"],
  ["teacher@utd.ac.th", true, teacher, "/dashboard (teacher)"],
  ["outside.teacher@gmail.com", true, teacher, "/dashboard (teacher)"], //  listed explicitly -> allowed
  ["x@utd.ac.th", true, { role: "admin", active: true }, "/pending-access"], //  admin is never granted by the table
  // 4. school address not in the table (or switched off) -> signed in, no back office
  ["student@utd.ac.th", true, null, "/pending-access"],
  ["member@utd.ac.th", true, off, "/pending-access"],
  // 5. everything else is refused — an unlisted address cannot get in
  ["someone.else@gmail.com", true, null, "/login?error=domain"],
  ["outside.teacher@gmail.com", true, off, "/login?error=domain"],
  ["x@utd.ac.th.evil.com", true, null, "/login?error=domain"],
  ["x@evilutd.ac.th", true, null, "/login?error=domain"],
];
for (const [email, verified, row, want] of cases) {
  assert.equal(destination(email, verified, row), want, `${JSON.stringify(email)} verified=${verified} row=${JSON.stringify(row)}`);
}

// COUNCIL_EMAILS parsing (seed input): trimmed, lower-case, ":shared" marker
assert.deepEqual(councilEmails(), [{ email: "shared.council@utd.ac.th", shared: true }, { email: "member@utd.ac.th", shared: false }]);
assert.equal(normalizeEmail("  A.B@UTD.AC.TH "), "a.b@utd.ac.th");
console.log(`auth rules ok — ${cases.length} cases + COUNCIL_EMAILS parsing`);
