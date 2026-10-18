# สภานักเรียนโรงเรียนอุตรดิตถ์ — Website

Next.js (App Router, TypeScript) + Tailwind v4 + Motion + GSAP ScrollTrigger. Design tokens mirror the Figma file
`UTD Student Council Website`. Decisions and placeholders: see [NOTES.md](NOTES.md).

## Run

```bash
npm install
cp .env.example .env.local   # set APP_SECRET at minimum for `npm run build && npm start`
npm run dev                  # http://localhost:3000
npm run build && npm start   # production (needs APP_SECRET, Supabase, Turnstile — see below)
```

`npm run dev` works with no env at all (in-memory rate limit, voice saved to `.data/voice.jsonl`, Turnstile skipped).

## Environment (`.env.example`)

| Var | Needed | Purpose |
|---|---|---|
| `APP_SECRET` | production | HMAC for API tokens + IP-hash salt (>= 16 chars) |
| `NEXT_PUBLIC_SITE_URL` | production | sitemap / Open Graph |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | production | store `/voice` messages (never expose the service key) |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | production | shared rate limit + IP ban list |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | production | Cloudflare Turnstile on `/voice` (fails closed in production without the secret) |

Supabase table:

```sql
create table voice_messages (
  code text primary key, category text not null, message text not null,
  anonymous boolean not null, ip_hash text not null,
  status text not null default 'received', reply text,
  public boolean not null default false, created_at timestamptz not null default now()
);
alter table voice_messages enable row level security;  -- no policies: only the service role can read/write
```

Messages are **never shown publicly automatically** (`public=false`); a council member approves/answers by editing `status`, `reply`, `public`.

## Editing content

| What | Where |
|---|---|
| News / events / policies / members | `content/*.json` (news & events need a unique `slug`; dates `YYYY-MM-DD`; policy `status`: `done` \| `in-progress` \| `planned`) |
| School name, address, nav, term year, slogan, history timeline | `lib/site.ts` |
| Marquee announcements | `components/sections/AnnouncementMarquee.tsx` |
| Home stats numbers | `components/sections/Stats.tsx` |
| Documents (downloads) | `lib/content.ts` -> `DOCUMENTS` |
| Colours / fonts / spacing tokens | `app/globals.css` (+ `app/layout.tsx` for fonts) |
| Mandapa artwork | `MANDAPA_PATH` in `lib/site.ts` |

Everything in `[brackets]` is a placeholder awaiting real data.

## Scraping protection (what exists)

1. **`proxy.ts`**: blocks empty UA, scraper tools (curl, wget, python-requests, scrapy, HTTrack, Go-http-client, headless...) and AI
   crawlers with 403; rate limit per IP (pages 60/min, API 20/min -> 429 + `Retry-After`); verifies Googlebot/Bingbot by reverse DNS;
   honeypot + scanner paths ban the IP for 1h; per-request CSP nonce.
2. **`app/robots.ts`**: search engines allowed; AI/dataset crawlers disallowed; `/api/`, `/admin/`, `/_hp/` disallowed. `X-Robots-Tag: noai, noimageai`.
3. **APIs**: no endpoint returns everything (page size capped at 20); requires same-origin + 5-minute HMAC token from `/api/token`.
   Member data is name/role/grade only. `/voice` stores IP as a salted hash, with honeypot field, zod validation, 3 submits / 10 min / IP, Turnstile.
4. **Headers** (`next.config.ts` + `proxy.ts`): CSP, `frame-ancestors 'none'`, `X-Frame-Options: DENY`, nosniff, Referrer-Policy, Permissions-Policy, HSTS;
   `productionBrowserSourceMaps: false`, `poweredByHeader: false`.
5. Front-end: `user-select: none` only on logos/graphics (text stays copyable). No right-click/F12 blocking (ineffective, hurts users).

Not implemented: image watermarking and hotlink protection (no real photos yet — add when images exist; `next/image` is ready).

### Extra hardening on Vercel
Enable **Vercel Firewall** (Project -> Firewall): add a rate-limit rule and turn on **Attack Challenge Mode** when under attack;
consider Vercel BotID on `/voice` in addition to Turnstile.

### Honest limits
This raises the cost of scraping; it cannot make it impossible. Anyone who renders the page in a normal browser can read what a
visitor can read. In-memory rate limiting is per-instance — configure Upstash in production.

## Verify

```bash
node scripts/smoke-voice.mjs              # voice action: valid / invalid / honeypot / rate limit (dev server running)
curl -I http://localhost:3000/            # 403 (curl UA blocked)
```
