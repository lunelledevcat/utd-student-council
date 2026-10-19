// Builds with the test-only public values (Turnstile always-pass site key, local site URL), then runs Playwright.
// Usage: npm run test:e2e [-- <playwright args>]
import { spawnSync } from "node:child_process";

const shell = process.platform === "win32";
const env = { ...process.env, NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA", NEXT_PUBLIC_SITE_URL: "http://localhost:3100" };
const step = (cmd, args) => {
  const r = spawnSync(cmd, args, { stdio: "inherit", env, shell });
  if (r.status !== 0) process.exit(r.status ?? 1);
};
if (!process.argv.includes("--no-build")) step("npx", ["next", "build"]);
step("npx", ["playwright", "test", ...process.argv.slice(2).filter((a) => a !== "--no-build")]);
