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
