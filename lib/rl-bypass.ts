import { createHmac, timingSafeEqual } from "node:crypto";
import { adminEmails, normalizeEmail } from "./env.ts"; // relative + extension: also loaded by plain Node in scripts/test-rate-limit.mts

// Rate-limit bypass for administrators (ADMIN_EMAILS only). Issued by /auth/callback AFTER Supabase verified the
// Google sign-in and the address matched ADMIN_EMAILS — never from anything the browser claims.
// Cookie value: base64url(email).exp.HMAC-SHA256(APP_SECRET, "email|exp"); httpOnly, Secure, SameSite=Lax, 12 h.
// The proxy honours it only for /auth/* and the admin pages, and only for the app's rate limits (bot blocks, bans,
// CSP, Turnstile and Cloudflare stay in force). The address is re-checked against ADMIN_EMAILS on every use, so
// removing it from the env var revokes the cookie at once.

export const RL_BYPASS_COOKIE = "rl_bypass";
export const RL_BYPASS_TTL_SEC = 12 * 3600;
/** Cookie paths: the sign-in routes and the admin pages of each locale (cookies are not sent anywhere else). */
export const RL_BYPASS_PATHS = ["/auth", "/th/admin", "/en/admin"];
/** Paths where a valid cookie skips the app's rate limit. */
export const RL_BYPASS_SCOPE = /^\/(auth\/|(th|en)\/admin(\/|$))/;

function secret() {
  const s = process.env.APP_SECRET;
  if (s && s.length >= 16) return s;
  return process.env.NODE_ENV === "production" ? null : "dev-only-secret-change-me";
}
const mac = (key: string, data: string) => createHmac("sha256", key).update(data).digest("base64url");

/** Cookie value for a verified admin address, or null if the address is not in ADMIN_EMAILS (or no secret). */
export function issueBypass(email: string, nowSec = Math.floor(Date.now() / 1000)) {
  const key = secret();
  const e = normalizeEmail(email);
  if (!key || !adminEmails().includes(e)) return null;
  const exp = nowSec + RL_BYPASS_TTL_SEC;
  return `${Buffer.from(e).toString("base64url")}.${exp}.${mac(key, `${e}|${exp}`)}`;
}

/** The admin address a cookie value proves, or null (bad signature, expired, malformed, or no longer an admin). */
export function verifyBypass(value: string | null | undefined, nowSec = Math.floor(Date.now() / 1000)): string | null {
  const key = secret();
  if (!key || !value) return null;
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const [b64, expRaw, sig] = parts;
  if (!/^\d{1,12}$/.test(expRaw)) return null;
  const exp = Number(expRaw);
  if (exp <= nowSec || exp > nowSec + RL_BYPASS_TTL_SEC) return null;
  let email: string;
  try {
    email = Buffer.from(b64, "base64url").toString("utf8");
  } catch {
    return null;
  }
  const want = Buffer.from(mac(key, `${email}|${exp}`));
  const got = Buffer.from(sig);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
  // exact (lower-case) match with the current list — no wildcard, no domain match
  return adminEmails().includes(normalizeEmail(email)) && email === normalizeEmail(email) ? email : null;
}
