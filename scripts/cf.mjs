// npm run preview / deploy: OpenNext build, then preview (workerd, local D1/R2/KV) or deploy.
// Usage: node scripts/cf.mjs build|preview|deploy [extra args]
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const win = process.platform === "win32";
const shim = fileURLToPath(new URL("./win-symlink.cjs", import.meta.url));
const env = { ...process.env, ...(win ? { NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ""} --require=${shim.replace(/\\/g, "/")}`.trim() } : {}) };
const run = (args) => {
  const r = spawnSync("npx", ["opennextjs-cloudflare", ...args], { stdio: "inherit", env, shell: win });
  if (r.status !== 0) process.exit(r.status ?? 1);
};
const [cmd = "build", ...rest] = process.argv.slice(2);
if (!rest.includes("--no-build")) run(["build"]);
if (cmd !== "build") run([cmd, ...rest.filter((a) => a !== "--no-build")]);
