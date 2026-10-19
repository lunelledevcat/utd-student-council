// Copies data from Supabase (Postgres) to D1. Safe to re-run: every row is INSERT OR REPLACE by primary key.
// Files (photos) are copied by scripts/migrate-storage-to-r2.mjs — rows only here.
//
//   node scripts/migrate-supabase-to-d1.mjs              writes .wrangler/supabase-export.sql and applies it locally
//   node scripts/migrate-supabase-to-d1.mjs --remote     ... and applies it to the production D1 (asks wrangler login)
//   node scripts/migrate-supabase-to-d1.mjs --dry        only writes the SQL file
//
// Needs in .env.local: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (read-only use).
// profiles -> users (same id, so authorship survives). Google accounts are linked again on first sign-in
// (Auth.js links by the verified email).
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => /^[A-Z0-9_]+=/.test(l))
  .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]));
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ || !KEY) throw new Error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing in .env.local");

async function all(table) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const r = await fetch(`${URL_}/rest/v1/${table}?select=*`, { headers: { apikey: KEY, authorization: `Bearer ${KEY}`, range: `${from}-${from + 999}` } });
    if (!r.ok) throw new Error(`${table}: ${r.status} ${await r.text()}`);
    const rows = await r.json();
    out.push(...rows);
    if (rows.length < 1000) return out;
  }
}

const q = (v) => {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "boolean") return v ? "1" : "0";
  if (typeof v === "number") return String(v);
  if (typeof v === "object") return q(JSON.stringify(v));
  return `'${String(v).replace(/'/g, "''")}'`;
};
const iso = (v) => (v ? new Date(v).toISOString() : v);
const insert = (table, rows) => rows.map((r) => `INSERT OR REPLACE INTO "${table}" (${Object.keys(r).map((k) => `"${k}"`).join(",")}) VALUES (${Object.values(r).map(q).join(",")});`);
const pick = (r, cols) => Object.fromEntries(cols.filter((c) => c in r).map((c) => [c, /_at$/.test(c) ? iso(r[c]) : r[c]]));

// D1 column lists (lib/db/schema.ts); anything not listed (albums, event_slug, hero_requested, album_id) is dropped
const REVIEW = ["status", "author_id", "reviewed_by", "reviewed_at", "reason", "created_at", "updated_at"];
const COLS = {
  academic_years: ["year", "is_current", "created_at"],
  announcements: ["id", "year", "slug", "title", "title_en", "tag", "excerpt", "body", "body_en", "published_on", "link_url", "cover_photo_id", "pinned", ...REVIEW],
  activities: ["id", "year", "slug", "title", "title_en", "event_date", "event_time", "place", "summary", "body", "body_en", ...REVIEW],
  policies: ["id", "year", "slug", "title", "title_en", "summary", "summary_en", "body", "body_en", "progress_status", "progress", "owner", "owner_en", "timeline", "cover_photo_id", "sort_order", ...REVIEW],
  members: ["id", "year", "name", "name_en", "nickname", "nickname_en", "instagram", "contact", "consent_public", "photo_id", "sort_order", "role_title", "role_title_en", "term_no", "exec_title", "exec_title_en", "dept", "dept_en", "party", "party_en", "grade", ...REVIEW],
  advisors: ["id", "year", "name", "name_en", "nickname", "nickname_en", "instagram", "contact", "consent_public", "photo_id", "sort_order", "role_label", "role_label_en", "subject_group", "subject_group_en", "position", "position_en", ...REVIEW],
  photos: ["id", "caption", "credit", "width", "height", "blur", "static_path", "is_hero", "hero_order", "activity_id", "policy_id", "sort_order", "uploaded_by", "status", "reviewed_by", "reviewed_at", "reason", "created_at"],
  role_invites: ["email", "role", "created_by", "created_at"],
  voice_messages: ["id", "ref_code", "category", "message", "anonymous", "ip_hash", "status", "created_at"],
  voice_replies: ["id", "voice_id", "body", "status", "author_id", "reviewed_by", "reviewed_at", "reason", "created_at"],
  audit_logs: ["actor_id", "actor_email", "action", "target_table", "target_id", "detail", "created_at"],
};

const sql = ["PRAGMA defer_foreign_keys = on;"];
const profiles = await all("profiles");
sql.push(...insert("users", profiles.map((p) => ({ id: p.id, email: p.email.toLowerCase(), role: p.role, last_login_at: iso(p.last_login_at), created_at: iso(p.created_at), emailVerified: Date.parse(p.created_at) }))));
const counts = { users: profiles.length };
// order matters for foreign keys: years, then rows that photos point to, then photos
for (const t of ["academic_years", "announcements", "activities", "policies", "members", "advisors", "photos", "role_invites", "voice_messages", "voice_replies", "audit_logs"]) {
  const rows = (await all(t)).map((r) => pick(r, COLS[t]));
  counts[t] = rows.length;
  sql.push(...insert(t, rows));
}

mkdirSync(".wrangler", { recursive: true });
writeFileSync(".wrangler/supabase-export.sql", sql.join("\n") + "\n");
console.log("exported:", JSON.stringify(counts));
if (process.argv.includes("--dry")) process.exit(0);
const where = process.argv.includes("--remote") ? "--remote" : "--local";
const r = spawnSync("npx", ["wrangler", "d1", "execute", "utd-council", where, "--file", ".wrangler/supabase-export.sql", "-y"], { stdio: "inherit", shell: process.platform === "win32" });
process.exit(r.status ?? 1);
