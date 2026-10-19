// npm run security:check — every security check of the Cloudflare build in one command. Exit 1 if any fails.
//   1. data access: no RLS on D1, so only the data layer may query it — no other file imports drizzle query
//      builders or the schema (type-only imports allowed)
//   2. access rules: unit tests of lib/data/* on a real D1 (vitest)
//   3. app (Playwright, e2e/security.spec.ts, on the OpenNext build in workerd with local D1/R2/KV):
//      headers (curl -I), unauthenticated write -> 401, council cannot open another's row, anonymous sees no pending
//      rows/files, <script> shown as text, .html renamed .jpg rejected (browser + server magic bytes),
//      sign-in redirect (PKCE, HttpOnly/Lax cookies), sign out everywhere
//   4. config: wrangler.jsonc "vars" hold only public values; .dev.vars / .env* are gitignored
//   5. secrets in the browser bundle (.next/static, .open-next/assets)
//   6. npm audit: production dependencies, high/critical -> fail; dev-only findings are listed
// Options: --no-e2e (skip 3), --no-build (reuse the existing build)
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const shell = process.platform === "win32";
const results = [];
const check = (name, ok, info = "") => { results.push({ name, ok }); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${info ? `  (${info})` : ""}`); };
const run = (cmd, args, opts = {}) => spawnSync(cmd, args, { stdio: "inherit", shell, ...opts });

// ── 1. only the data layer touches the database ──
const ALLOWED = [/^lib\/data\//, /^lib\/db\//, /^lib\/authjs\.ts$/, /^lib\/ratelimit\.ts$/, /^lib\/security-log\.ts$/];
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
const offenders = ["app", "lib", "components"].flatMap(walk).concat(["proxy.ts"]).map((f) => f.replace(/\\/g, "/"))
  .filter((f) => /\.(ts|tsx)$/.test(f) && !ALLOWED.some((r) => r.test(f)))
  .filter((f) => {
    const src = readFileSync(f, "utf8");
    return /from "drizzle-orm[^"]*"/.test(src) || /import \{[^}]*\} from "@\/lib\/db\/schema"/.test(src.replace(/import type \{[^}]*\} from "@\/lib\/db\/schema"/g, ""));
  });
check("database queried only through lib/data/*", offenders.length === 0, offenders.join(", "));

// ── 2. access rules (unit) ──
check("access rules: unit tests (lib/data/rules.test.ts)", run("npx", ["vitest", "run"]).status === 0);

// ── 3. app checks (Playwright) ──
if (!process.argv.includes("--no-e2e")) {
  const args = ["scripts/e2e.mjs", ...(process.argv.includes("--no-build") ? ["--no-build"] : []), "e2e/security.spec.ts"];
  check("app security tests (e2e/security.spec.ts)", run("node", args).status === 0);
}

// ── 4. config ──
const wr = readFileSync("wrangler.jsonc", "utf8").replace(/^\s*\/\/.*$/gm, "");
const vars = Object.keys(JSON.parse(wr).vars ?? {});
const PUBLIC = ["NEXT_PUBLIC_SITE_URL", "NEXT_PUBLIC_TURNSTILE_SITE_KEY", "ALLOWED_EMAIL_DOMAIN", "ADMIN_EMAILS"];
check("wrangler.jsonc vars are public values only", vars.every((v) => PUBLIC.includes(v)), vars.filter((v) => !PUBLIC.includes(v)).join(", "));
const ignored = (f) => spawnSync("git", ["check-ignore", "-q", f]).status === 0;
check(".dev.vars and .env.local are gitignored", ignored(".dev.vars") && ignored(".env.local"));

// ── 5. secrets in the browser bundle ──
check("no secret in .next/static", run("node", ["scripts/secret-scan.mjs", "--build"]).status === 0);
if (existsSync(".open-next/assets")) {
  const devVars = existsSync(".dev.vars") ? readFileSync(".dev.vars", "utf8").split(/\r?\n/).filter((l) => /^[A-Z0-9_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]).filter(([k, v]) => v.length >= 12 && !PUBLIC.includes(k) && !k.startsWith("NEXT_PUBLIC_")) : [];
  const hits = walk(".open-next/assets").filter((f) => /\.(js|css|html|json)$/.test(f))
    .filter((f) => { const t = readFileSync(f, "utf8"); return /sb_secret_|GOCSPX-|-----BEGIN [A-Z ]*PRIVATE KEY/.test(t) || devVars.some(([, v]) => t.includes(v)); });
  check("no secret in .open-next/assets", hits.length === 0, hits.join(", "));
}

// ── 6. dependencies ──
const prod = spawnSync("npm", ["audit", "--omit=dev", "--audit-level=high"], { encoding: "utf8", shell });
check("npm audit (production deps, high/critical)", prod.status === 0, prod.stdout.trim().split("\n").pop());
const all = spawnSync("npm", ["audit", "--json"], { encoding: "utf8", shell });
try {
  const v = Object.entries(JSON.parse(all.stdout).vulnerabilities ?? {}).filter(([, x]) => ["high", "critical"].includes(x.severity));
  if (v.length) console.log(`INFO  dev-only advisories (not shipped): ${v.map(([n]) => n).join(", ")} — see SECURITY.md`);
} catch { /* ignore */ }

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
