// Env access in one place. On Cloudflare, vars + secrets (wrangler.jsonc / wrangler secret put / .dev.vars) are on
// process.env (nodejs_compat).

/**
 * Public values (wrangler.jsonc "vars") read at RUNTIME. Next.js replaces a literal `process.env.NEXT_PUBLIC_X` with
 * its build-time value, so these are read by computed name: changing a var in Cloudflare needs no rebuild.
 */
export const publicEnv = (name: "NEXT_PUBLIC_SITE_URL" | "NEXT_PUBLIC_TURNSTILE_SITE_KEY") => process.env[name] ?? "";
export const siteUrl = () => publicEnv("NEXT_PUBLIC_SITE_URL") || "http://localhost:3000";

/** Google sign-in is usable: Auth.js secret + Google OAuth client set. */
export const authConfigured = () => !!(process.env.AUTH_SECRET && process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

const list = (v: string | undefined) =>
  (v ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);

export const allowedDomain = () => (process.env.ALLOWED_EMAIL_DOMAIN ?? "utd.ac.th").trim().toLowerCase().replace(/^@/, "");
export const adminEmails = () => list(process.env.ADMIN_EMAILS);

/** Server-side domain check. Never trust Google's `hd` hint alone. */
export function isAllowedEmail(email: string | null | undefined) {
  if (!email) return false;
  const e = email.trim().toLowerCase();
  return e.endsWith(`@${allowedDomain()}`) && e.split("@").length === 2;
}

/**
 * Who may hold a session at all (checked on the server for every request and at the OAuth callback):
 * a Google-verified address that is either on ALLOWED_EMAIL_DOMAIN or listed in ADMIN_EMAILS. The admin list is the
 * only exception to the domain rule. Comparison is trimmed + lower-case.
 */
export function canSignIn(email: string | null | undefined, googleVerified: boolean) {
  if (!email || !googleVerified) return false;
  const e = email.trim().toLowerCase();
  return isAllowedEmail(e) || adminEmails().includes(e);
}

/** Role from ADMIN_EMAILS (re-evaluated every request) or the role stored on the user; null = signed in, no access yet. */
export function roleFor(email: string, storedRole: string | null | undefined): "admin" | "council" | "teacher" | null {
  if (adminEmails().includes(email.trim().toLowerCase())) return "admin";
  return storedRole === "council" || storedRole === "teacher" ? storedRole : null;
}
