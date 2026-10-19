// Applies supabase/migrations/*.sql to the Supabase project, in order, each in its own transaction, through the
// Supabase Management API (no psql / CLI needed). Applied versions are recorded in supabase_migrations.schema_migrations
// (the table the Supabase CLI uses), so a file never runs twice and `supabase db push` agrees later.
//
//   npm run db:migrate            apply pending migrations
//   npm run db:migrate -- --dry   list what would run
//
// Needs in .env.local (gitignored):
//   SUPABASE_ACCESS_TOKEN=sbp_...   personal access token: supabase.com → avatar (top right) → Account preferences
//                                   → Access Tokens → Generate new token. Revoke it there when done.
//   NEXT_PUBLIC_SUPABASE_URL        project URL (the project ref is taken from it)
import { readFileSync, readdirSync } from "node:fs";

const root = new URL("..", import.meta.url);
const env = { ...Object.fromEntries(
  readFileSync(new URL(".env.local", root), "utf8").split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.trimStart().startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
), ...process.env };

const token = env.SUPABASE_ACCESS_TOKEN;
const ref = (env.NEXT_PUBLIC_SUPABASE_URL ?? "").match(/^https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1];
if (!token || !ref) {
  console.error("Missing SUPABASE_ACCESS_TOKEN or NEXT_PUBLIC_SUPABASE_URL in .env.local (see the header of this script).");
  process.exit(1);
}
const dry = process.argv.includes("--dry");

async function sql(query) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`${r.status} ${text.slice(0, 600)}`);
  return text ? JSON.parse(text) : [];
}

await sql(`create schema if not exists supabase_migrations;
  create table if not exists supabase_migrations.schema_migrations (version text primary key, statements text[], name text);`);
const done = new Set((await sql("select version from supabase_migrations.schema_migrations")).map((r) => r.version));

const dir = new URL("supabase/migrations/", root);
const files = readdirSync(dir).filter((f) => /^\d+_.+\.sql$/.test(f)).sort();
const pending = files.filter((f) => !done.has(f.split("_")[0]));
console.log(`project ${ref}: ${files.length} migrations, ${done.size} already applied, ${pending.length} pending`);
if (dry) { pending.forEach((f) => console.log("  would apply", f)); process.exit(0); }

for (const f of pending) {
  const version = f.split("_")[0];
  const name = f.replace(/^\d+_/, "").replace(/\.sql$/, "");
  const body = readFileSync(new URL(f, dir), "utf8");
  process.stdout.write(`  applying ${f} ... `);
  try {
    // one transaction per file: either the whole migration and its bookkeeping row land, or nothing does
    await sql(`begin;\n${body}\n;insert into supabase_migrations.schema_migrations (version, name, statements) values ('${version}', '${name.replace(/'/g, "''")}', array[]::text[]);\ncommit;`);
    console.log("ok");
  } catch (e) {
    console.log("FAILED");
    console.error(String(e.message ?? e));
    console.error(`Stopped. ${f} was rolled back; earlier files stay applied.`);
    process.exit(1);
  }
}
console.log("done");
