// npm run test:e2e [-- <playwright args>]
// 1. OpenNext build (skip with --no-build)
// 2. fresh local state in e2e/.state + D1 migrations (drizzle/)
// 3. test-only vars in e2e/.auth/e2e.vars: random secrets, Cloudflare's documented always-pass Turnstile test keys,
//    the e2e admin in ADMIN_EMAILS, a dummy Google client (Google is never contacted)
// 4. Playwright (starts `wrangler dev` on :3100 with those vars)
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";

const shell = process.platform === "win32";
const args = process.argv.slice(2);
const step = (cmd, a) => {
  const r = spawnSync(cmd, a, { stdio: "inherit", shell });
  if (r.status !== 0) process.exit(r.status ?? 1);
};
if (!args.includes("--no-build")) step("node", ["scripts/cf.mjs", "build"]);

rmSync("e2e/.state", { recursive: true, force: true });
step("npx", ["wrangler", "d1", "migrations", "apply", "utd-council", "--local", "--persist-to", "e2e/.state"]);

mkdirSync("e2e/.auth", { recursive: true });
const rnd = () => randomBytes(32).toString("base64url");
writeFileSync("e2e/.auth/e2e.vars", [
  `APP_SECRET=${rnd()}`,
  `AUTH_SECRET=${rnd()}`,
  "AUTH_GOOGLE_ID=e2e-dummy.apps.googleusercontent.com",
  "AUTH_GOOGLE_SECRET=e2e-dummy",
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA",
  "TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA",
  "NEXT_PUBLIC_SITE_URL=http://localhost:3100",
  "ALLOWED_EMAIL_DOMAIN=utd.ac.th",
  "ADMIN_EMAILS=e2e-admin@utd.ac.th",
  "",
].join("\n"));

step("npx", ["playwright", "test", ...args.filter((a) => a !== "--no-build")]);
