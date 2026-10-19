// Runs once when the server starts. In `next dev`, lists environment variables that are missing or still test values,
// with where to get each one (same source as /admin/setup and .env.example). Names only — values are never printed.
export async function register() {
  if (process.env.NODE_ENV !== "development" || process.env.NEXT_RUNTIME !== "nodejs") return;
  const { ENV_VARS, envStatus } = await import("@/lib/env-spec");
  const th = (await import("@/messages/th.json")).default as { setup: { devWarning: string; status: Record<string, string>; vars: Record<string, { where: string }> } };
  const bad = ENV_VARS.map((v) => ({ v, s: envStatus(v) })).filter(({ s }) => s !== "set");
  if (!bad.length) return;
  const lines = bad.map(({ v, s }) => `  ${s === "missing" ? "❌" : "⚠️ "} ${v.name} (${th.setup.status[s]})\n      ${th.setup.vars[v.name].where}\n      ${v.url}`);
  console.warn(`\n${th.setup.devWarning}\n${lines.join("\n")}\n`);
}
