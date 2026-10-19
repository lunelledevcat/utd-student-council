// Secret scan. Fails (exit 1) when a key-shaped string or any value from .env.local is found.
//   node scripts/secret-scan.mjs            staged changes (pre-commit hook: .githooks/pre-commit)
//   node scripts/secret-scan.mjs --build    the browser bundle (.next/static) — server-only keys must never be there
// GitHub secret scanning + push protection stay on as the second line.
import { execSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const PATTERNS = {
  "Supabase secret key": /sb_secret_[A-Za-z0-9_-]{10,}/,
  "Supabase access token": /sbp_[A-Za-z0-9]{20,}/,
  "JWT (service role / legacy key)": /eyJ[A-Za-z0-9_-]{20,}\.eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/,
  "Google client secret": /GOCSPX-[A-Za-z0-9_-]{10,}/,
  "Private key": /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
};
// values that may legitimately be public (shipped to the browser): skip them in --build mode
const PUBLIC_ENV = /^NEXT_PUBLIC_/;

const build = process.argv.includes("--build");
const envValues = existsSync(".env.local")
  ? readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => /^[A-Z0-9_]+=/.test(l))
      .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()])
      .filter(([k, v]) => v.length >= 12 && !v.includes("@") && !/^https?:\/\//.test(v) && !(build && PUBLIC_ENV.test(k)))
  : [];

function scan(name, text) {
  const hits = [];
  for (const [label, re] of Object.entries(PATTERNS)) if (re.test(text)) hits.push(label);
  for (const [k, v] of envValues) if (text.includes(v)) hits.push(`value of ${k}`);
  return hits.map((h) => `${name}: ${h}`);
}

let found = [];
if (build) {
  const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
  if (!existsSync(".next/static")) { console.error("no .next/static — run npm run build first"); process.exit(1); }
  for (const f of walk(".next/static")) if (/\.(js|css|html|json|map)$/.test(f)) found.push(...scan(f, readFileSync(f, "utf8")));
} else {
  const files = execSync("git diff --cached --name-only --diff-filter=ACMR", { encoding: "utf8" }).split("\n").filter(Boolean);
  for (const f of files) {
    if (/^\.env(\.|$)/.test(f) && f !== ".env.example") found.push(`${f}: env file must not be committed`);
    const added = execSync(`git diff --cached -U0 -- "${f}"`, { encoding: "utf8", maxBuffer: 1e8 }).split("\n").filter((l) => l.startsWith("+")).join("\n");
    found.push(...scan(f, added));
  }
}
if (found.length) {
  console.error(`secret scan FAILED (${build ? ".next/static" : "staged changes"}):\n  ` + found.join("\n  "));
  process.exit(1);
}
console.log(`secret scan ok (${build ? ".next/static" : "staged changes"})`);
