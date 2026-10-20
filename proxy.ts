import createIntlMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";
import { TRAP_PATHS, isAiCrawler, isBlockedTool, verifySearchBot } from "@/lib/bots";
import { SUPABASE_URL, supabaseConfigured } from "@/lib/env";
import { ban, isBanned, limit } from "@/lib/ratelimit";
import { clientIp } from "@/lib/client-ip";
import { RL_BYPASS_COOKIE, RL_BYPASS_SCOPE, verifyBypass } from "@/lib/rl-bypass";
import { auditBypass, logSecurity } from "@/lib/security-log";
import { refreshSession } from "@/lib/supabase/proxy";

const isDev = process.env.NODE_ENV === "development";
const SB_ORIGIN = SUPABASE_URL ? new URL(SUPABASE_URL).origin : "";

// Back office + auth pages: never indexed, require a session (role is checked again server-side in every page/action).
// Page paths may carry a locale prefix (/th, /en); next-intl adds it when missing.
const PRIVATE = /^(?:\/(?:th|en))?\/(dashboard|admin|pending-access)(\/|$)/;
const NOINDEX = /^(?:\/(?:th|en))?\/(dashboard|admin|pending-access|login|auth)(\/|$)/;
// Not pages: route handlers and files keep their unprefixed paths.
const NOT_PAGE = /^\/(api|auth|_hp)(\/|$)|\.[a-z0-9]+$/i;
const intl = createIntlMiddleware(routing);

function csp(nonce: string) {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://challenges.cloudflare.com${isDev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'nonce-${nonce}'`,
    "style-src-attr 'unsafe-inline'", // inline style="" from animation libs; scripts stay nonce-locked
    `img-src 'self' blob: data: ${SB_ORIGIN}`,
    "font-src 'self'",
    `connect-src 'self' ${SB_ORIGIN} https://challenges.cloudflare.com${isDev ? " ws: wss:" : ""}`,
    "frame-src https://challenges.cloudflare.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

function deny(status: number, body: string, extra?: Record<string, string>) {
  return new NextResponse(body, { status, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", ...extra } });
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ua = req.headers.get("user-agent") ?? "";
  // real visitor IP (Cloudflare sits in front of Vercel on utdsc.com) — see lib/client-ip.ts
  const ip = clientIp(req.headers);

  // 1) honeypot / scanner paths -> temp ban
  if (TRAP_PATHS.test(pathname)) {
    await ban(ip);
    void logSecurity("trap", { ip, path: pathname });
    return deny(403, "Forbidden");
  }
  if (await isBanned(ip)) return deny(403, "Forbidden");

  // 2) user agent policy
  if (!ua.trim()) {
    void logSecurity("ua_blocked", { ip, path: pathname, detail: { ua: "" } });
    return deny(403, "Forbidden");
  }
  if (isAiCrawler(ua) || isBlockedTool(ua)) {
    void logSecurity("ua_blocked", { ip, path: pathname, detail: { ua: ua.slice(0, 80) } });
    return deny(403, "Forbidden");
  }
  const searchBot = await verifySearchBot(ip, ua);
  if (searchBot === false && !isDev) {
    void logSecurity("fake_bot", { ip, path: pathname });
    return deny(403, "Forbidden");
  }

  // 3) rate limit (verified search bots are exempt)
  //    Google sign-in has its own buckets (start 20 / callback 40 per 10 min per IP); viewing /login is a normal page.
  if (searchBot !== true) {
    const bucket = pathname.startsWith("/auth/google") ? "authStart" : pathname.startsWith("/auth/") ? "authCallback" : pathname.startsWith("/api/") ? "api" : "page";
    const r = await limit(bucket, ip);
    if (!r.ok) {
      // an administrator's signed rl_bypass cookie skips the app's limit on /auth/* and the admin pages only
      const admin = RL_BYPASS_SCOPE.test(pathname) ? verifyBypass(req.cookies.get(RL_BYPASS_COOKIE)?.value) : null;
      if (admin) {
        void auditBypass(admin, { ip, path: pathname, rule: bucket });
      } else {
        void logSecurity("rate_limited", { ip, path: pathname, detail: { rule: bucket } });
        return deny(429, "Too Many Requests", { "retry-after": String(r.retryAfter) });
      }
    }
  }

  // 4) CSP with per-request nonce
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const policy = csp(nonce);
  const headers = new Headers(req.headers);
  headers.set("x-nonce", nonce);
  headers.set("content-security-policy", policy);
  // locale routing ("/" -> "/th", NEXT_LOCALE cookie); the request headers above (nonce) are passed through
  const res = NOT_PAGE.test(pathname) ? NextResponse.next({ request: { headers } }) : intl(new NextRequest(req, { headers }));
  if (res.headers.has("location")) return res;
  res.headers.set("content-security-policy", policy);
  if (NOINDEX.test(pathname)) res.headers.set("x-robots-tag", "noindex, nofollow, noai, noimageai");

  if (PRIVATE.test(pathname)) {
    const user = supabaseConfigured() ? await refreshSession(req, res) : null;
    if (!user) {
      // a write (Server Action POST) without a session gets a plain 401, not a redirect to the sign-in page
      if (req.method !== "GET" && req.method !== "HEAD") {
        void logSecurity("unauth_write", { ip, path: pathname });
        return deny(401, "Unauthorized");
      }
      const to = req.nextUrl.clone();
      to.pathname = `/${pathname.split("/")[1] === "en" ? "en" : "th"}/login`;
      to.search = "";
      return NextResponse.redirect(to);
    }
  }
  return res;
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
