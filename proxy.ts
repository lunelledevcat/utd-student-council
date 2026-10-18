import { NextRequest, NextResponse } from "next/server";
import { TRAP_PATHS, isAiCrawler, isBlockedTool, verifySearchBot } from "@/lib/bots";
import { SUPABASE_URL, supabaseConfigured } from "@/lib/env";
import { ban, isBanned, limit } from "@/lib/ratelimit";
import { refreshSession } from "@/lib/supabase/proxy";

const isDev = process.env.NODE_ENV === "development";
const SB_ORIGIN = SUPABASE_URL ? new URL(SUPABASE_URL).origin : "";

// Back office + auth pages: never indexed, require a session (role is checked again server-side in every page/action).
const PRIVATE = /^\/(dashboard|admin|pending-access)(\/|$)/;
const NOINDEX = /^\/(dashboard|admin|pending-access|login|auth)(\/|$)/;

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
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";

  // 1) honeypot / scanner paths -> temp ban
  if (TRAP_PATHS.test(pathname)) {
    await ban(ip);
    console.warn(`[security] trap hit ip=${ip} path=${pathname}`);
    return deny(403, "Forbidden");
  }
  if (await isBanned(ip)) return deny(403, "Forbidden");

  // 2) user agent policy
  if (!ua.trim()) {
    console.warn(`[security] empty UA ip=${ip} path=${pathname}`);
    return deny(403, "Forbidden");
  }
  if (isAiCrawler(ua) || isBlockedTool(ua)) {
    console.warn(`[security] blocked UA ip=${ip} ua=${ua.slice(0, 80)}`);
    return deny(403, "Forbidden");
  }
  const searchBot = await verifySearchBot(ip, ua);
  if (searchBot === false && !isDev) {
    console.warn(`[security] fake search bot ip=${ip}`);
    return deny(403, "Forbidden");
  }

  // 3) rate limit (verified search bots are exempt)
  if (searchBot !== true) {
    const bucket = pathname === "/login" || pathname.startsWith("/auth/google") ? "login" : pathname.startsWith("/api/") ? "api" : "page";
    const r = await limit(bucket, ip);
    if (!r.ok) {
      console.warn(`[security] 429 bucket=${bucket} ip=${ip}`);
      return deny(429, "Too Many Requests", { "retry-after": String(r.retryAfter) });
    }
  }

  // 4) CSP with per-request nonce
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const policy = csp(nonce);
  const headers = new Headers(req.headers);
  headers.set("x-nonce", nonce);
  headers.set("content-security-policy", policy);
  const res = NextResponse.next({ request: { headers } });
  res.headers.set("content-security-policy", policy);
  if (NOINDEX.test(pathname)) res.headers.set("x-robots-tag", "noindex, nofollow, noai, noimageai");

  if (PRIVATE.test(pathname)) {
    const user = supabaseConfigured() ? await refreshSession(req, res) : null;
    if (!user) {
      const to = req.nextUrl.clone();
      to.pathname = "/login";
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
