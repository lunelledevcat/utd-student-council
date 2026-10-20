# Security

How this site is protected, and how to check it. Run **`npm run security:check`** before every release
(it builds, starts the app on :3100, and needs `.env.local`; `--no-e2e` runs only the database and bundle checks).

Report a problem privately to the council's administrator. Do not open a public issue with details.

## 1. Who can do what

| Layer | Rule |
|---|---|
| Sign-in | Google only, Google-verified address; `lib/env.ts decideAccess`: ADMIN_EMAILS -> admin, active `allowed_users` row -> its role, other `@utd.ac.th` -> pending, else refused. Rate limits per real client IP: start (`/auth/google`) 20 / 10 min, callback + other `/auth/*` 40 / 10 min, own key prefixes, fail-open only for these if Upstash is down. |
| Roles | `admin` = listed in `ADMIN_EMAILS` (re-checked on every request, synced to `profiles.role`); `teacher` / `council` = `profiles.role`. |
| Pages | `requireRole()` in every back-office page/layout (`lib/auth.ts`). |
| Server Actions / route handlers | `authorize()` — the one check, run first in every action (`app/[locale]/dashboard/actions.ts`). The UI is never trusted. Denials are logged. |
| Proxy | Private paths need a session; a write (POST) without one gets **401**, a page view is sent to sign-in. |
| Database | RLS on **every** table (checked by `security:check`). Council writes go through the user's own session, so RLS + the `lock_review_columns` trigger decide (council rows are always `pending`; only staff can approve). The service role is used only after `authorize()`. |
| IDOR | Rows: RLS limits council to their own rows (another's row = 404, nothing reveals that it exists). Photos: a council member can attach only their own uploads or photos already on that row (approved photos are public, so "can read" is not enough). |
| Role changes | Every change of `profiles.role` is written to `audit_logs` by a database trigger (`role.change`), whoever makes it — app, SQL editor or dashboard. Shown in `/admin/security`. |

## 2. Input and output

- All form input is validated on the server with **zod** (`lib/admin/validate.ts`): lengths, ISO dates, enum choices,
  UUIDs, `https://` URLs only (`javascript:`, `data:`, `http:` refused), NUL bytes stripped.
- Content is stored and rendered as **plain text**. React escapes it. The only `dangerouslySetInnerHTML` is the static
  schema.org JSON-LD in the site layout (config from `lib/school-info.ts`, `<` escaped, no user data).
  A `<script>` in a title shows as text (tested). DOMPurify is not installed because no user HTML is ever rendered.
  Add it before any rich-text/HTML feature.
- External links: `target="_blank" rel="noopener noreferrer nofollow"`.

## 3. Uploads

- The browser checks the file's magic bytes (JPEG/PNG/WebP only; SVG, HTML and renamed files are refused) and converts the image to WebP.
  It then PUTs it straight to Storage using a **one-time signed URL**. That URL is issued only after `authorize()` and only for `incoming/<own user id>/<random uuid>.webp`.
- Server, before registering the photo: the file exists, is ≤ 10 MB, the **magic bytes say WebP** and sharp can decode it (≤ 60 MP).
  Otherwise the file is deleted, the event is logged and the user sees "not a supported image".
- The bucket `pending` is private and accepts `image/webp` only (≤ 10 MB). Variants are re-encoded with sharp, which strips EXIF/GPS.
- Previews of unapproved photos use signed URLs valid for **10 minutes**, and only for rows the user can open.
  Approved photos are copied to the public bucket.

## 4. Sessions and requests

- Auth cookies are **HttpOnly**, `Secure` in production and `SameSite=Lax` (`lib/supabase/proxy.ts AUTH_COOKIE`). No browser code
  talks to Supabase, so no script can read the session.
- Every session is verified with the Auth server (`getUser()`), never trusted from the cookie alone.
- CSRF: Server Actions reject cross-origin posts (Next.js compares `Origin` with `Host`). Route handlers that change state check
  the same origin (`isSameOrigin`), and the public voice form also needs a short-lived HMAC token (`/api/token`) and Turnstile.
- **Sign out on every device**: `/admin/security` posts `scope=global` to `/auth/signout`, which revokes all of the account's sessions.

## 4b. Real client IP and the admin rate-limit bypass

- utdsc.com is proxied by Cloudflare in front of Vercel, so `x-forwarded-for` is a Cloudflare edge address. `lib/client-ip.ts`
  trusts `cf-connecting-ip` only for Host utdsc.com / www.utdsc.com AND a connection from a published Cloudflare range;
  otherwise `x-vercel-forwarded-for` -> first `x-forwarded-for`; a Cloudflare address is never used as a key. Rate limits,
  honeypot bans, search-bot checks and IP hashes all use it.
- `rl_bypass` cookie (ADMIN_EMAILS only): set by `/auth/callback` after Supabase verified the Google sign-in; value
  base64url(email).exp.HMAC-SHA256(APP_SECRET, email|exp), httpOnly, Secure, SameSite=Lax, 12 h, paths `/auth`, `/th/admin`,
  `/en/admin`. The proxy honours it only there and only for the app's rate limit (bot blocks, bans, CSP, Turnstile,
  Cloudflare unaffected); the address is re-checked against ADMIN_EMAILS each time. Uses that let a would-be-blocked
  request through are audited (`rl_bypass:used`, email + IP hash); issue / clear on sign-out are audited too.
  Tests: `npm run test:rl`.

## 5. Headers (`proxy.ts`, `next.config.ts`)

| Header | Value |
|---|---|
| Content-Security-Policy | per-request **nonce**, `'strict-dynamic'`; no `unsafe-inline` / `unsafe-eval` for scripts in production; `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'` |
| Strict-Transport-Security | `max-age=63072000; includeSubDomains; preload` |
| X-Content-Type-Options | `nosniff` |
| Referrer-Policy | `strict-origin-when-cross-origin` |
| Permissions-Policy | camera, microphone, geolocation, interest-cohort off |
| Cross-Origin-Opener-Policy / -Resource-Policy | `same-origin` / `same-origin` |
| X-Frame-Options | `DENY` (old browsers) |

Known exception: `style-src-attr 'unsafe-inline'`. The animation library writes `style=""` attributes. This permits inline
*style attributes* only, not `<style>` blocks or any script.

## 6. Errors and monitoring

- Production errors show a generic message plus a **reference code** (the Next.js `digest`). The server log has the full
  error under the same code. Action errors are translated message keys, never raw database text.
- `public.security_events` is written only by the server and hidden from every token by RLS. It records:
  trap paths, blocked tools/bots, rate limits, unauthenticated writes, denied actions, rejected uploads, global sign-outs.
  IPs are stored only as salted hashes, and the same event is stored at most once a minute per source.
- `/admin/security` (admin only) shows the 7-day summary, recent events and role changes.

## 7. Secrets and dependencies

- Real values exist only in `.env.local` (gitignored) and in Vercel. `.env.example` has no values. The Google client secret is set only
  in Supabase.
- `scripts/secret-scan.mjs` runs as a **pre-commit hook** (`.githooks/pre-commit`, enabled by `npm install`). It blocks key-shaped
  strings, `.env` files and any value from `.env.local`. `--build` mode checks that no server key reached `.next/static`.
- GitHub secret scanning + push protection stay **on**.
- Dependabot (`.github/dependabot.yml`) checks npm weekly and GitHub Actions monthly.
- `npm audit --omit=dev --audit-level=high` must be clean (it is). The one open advisory (`braces` ≤ 3.0.3 via
  `eslint-config-next`) is lint tooling only, is never shipped, and has no patched release. npm's suggested "fix" downgrades Next 16 → 14, so it is not applied.
- `SUPABASE_ACCESS_TOKEN` (used only by `db:migrate` / `security:check`): revoke it in Supabase after use.

## 8. What `security:check` proves

| Check | How |
|---|---|
| RLS on every table, private WebP-only bucket | Management API query (`SUPABASE_ACCESS_TOKEN`) |
| anon key reads pending/hidden rows → 0; private tables → nothing; insert/approve refused; private storage not listable | REST calls with the public key |
| headers (curl -I) | `e2e/security.spec.ts` |
| unauthenticated admin action → 401 | POST with a `Next-Action` header, no session |
| council opens another's row → refused (404) | council session |
| `<script>` shown as text | approved row with a script/onerror payload; no script runs |
| `.html` renamed `.jpg` rejected | browser check, then HTML bytes forced into storage → server rejects, no row created |
| no secret in the browser bundle | `secret-scan.mjs --build` |
| dependencies | `npm audit` |
