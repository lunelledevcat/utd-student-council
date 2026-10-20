// Seeds public.allowed_users from COUNCIL_EMAILS (env or .env.local; comma-separated; ":shared" marks an account
// several people use). Every address gets role = council. Idempotent and non-destructive: an address that is already
// in the table is left exactly as the admin set it (role, active, shared) — the seed never re-enables a revoked user.
//   COUNCIL_EMAILS="council@utd.ac.th:shared,another@utd.ac.th" node scripts/seed-allowed-users.mjs
import { existsSync, readFileSync } from "node:fs";

const file = existsSync(".env.local") ? Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/)
  .filter((l) => /^[A-Z0-9_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()])) : {};
const env = { ...file, ...process.env };
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL, KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ || !KEY) throw new Error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing");

const rows = (env.COUNCIL_EMAILS ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean).map((x) => ({
  email: x.replace(/:shared$/, ""), role: "council", active: true, shared: x.endsWith(":shared"), created_by: "seed: COUNCIL_EMAILS",
}));
for (const r of rows) if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(r.email)) throw new Error(`not an e-mail address: entry ${rows.indexOf(r) + 1}`);
if (!rows.length) {
  console.log("COUNCIL_EMAILS is empty — nothing to seed");
  process.exit(0);
}
const res = await fetch(`${URL_}/rest/v1/allowed_users?on_conflict=email`, {
  method: "POST",
  headers: { apikey: KEY, authorization: `Bearer ${KEY}`, "content-type": "application/json", prefer: "resolution=ignore-duplicates,return=representation" },
  body: JSON.stringify(rows),
});
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
const added = await res.json();
console.log(`allowed_users: ${added.length} added, ${rows.length - added.length} already present (left unchanged)`);
