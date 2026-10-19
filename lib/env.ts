// Env access in one place. Only the Supabase URL / anon key are NEXT_PUBLIC_ (public by design).
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabaseConfigured = () => !!(SUPABASE_URL && SUPABASE_ANON_KEY);

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

/** Role from ADMIN_EMAILS (re-evaluated every request) or the role stored in profiles; null = signed in, no access yet. */
export function roleFor(email: string, storedRole: string | null | undefined): "admin" | "council" | "teacher" | null {
  if (adminEmails().includes(email.trim().toLowerCase())) return "admin";
  return storedRole === "council" || storedRole === "teacher" ? storedRole : null;
}
