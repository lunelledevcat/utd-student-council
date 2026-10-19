# Security

How this site is protected, and how to check it. Run **`npm run security:check`** before every release
(it builds, runs the app on workerd with local D1/R2/KV, and needs no production access; `--no-e2e` skips the browser part).

Report a problem privately to the council's administrator. Do not open a public issue with details.

Platform: Cloudflare Workers (OpenNext) + D1 + R2 + KV + Auth.js. Cloudflare-side settings (WAF, bots, rate-limit rules)
are listed step by step in README → "Cloudflare security settings".

## 1. Who can do what

| Layer | Rule |
|---|---|
| Sign-in | Google only (Auth.js), Google-verified address on `@utd.ac.th` or listed in `ADMIN_EMAILS` (`lib/env.ts canSignIn`, checked in the Auth.js `signIn` callback and again on every request). 5 sign-in attempts / 15 min per IP (D1 counter). |
| Sessions | Database sessions in D1 (`sessions`): revocable. Cookie `__Secure-authjs.session-token`, HttpOnly, Secure on https, SameSite=Lax. PKCE + state on the Google redirect. |
| Roles | `admin` = `ADMIN_EMAILS` (re-read every request; stored role follows it, promote/demote audited); `teacher` / `council` = `users.role` (invites in `role_invites`). No role → `/pending-access`. |
| Pages | `requireRole()` in every back-office page/layout (`lib/auth.ts`). |
| Server Actions / route handlers | `authorize()` first in every action. Denials are logged. |
| Proxy | Private paths need a session cookie; a write (POST) without one gets **401**. The token itself is verified against D1 by the page/action. |
| Database | D1 has no RLS, so **every query goes through `lib/data/*`**, which applies `lib/data/rules.ts` (public: approved only; council: create as self + pending, edit own pending/rejected only — back to pending, delete own pending; staff: review; admin: years/security). `security:check` fails if any other file builds queries. The rules are unit-tested against a real D1 (`lib/data/rules.test.ts`). |
| IDOR | Rows: another's row = 404 (no existence leak). Photos: a council member can attach only their own uploads or photos already on that row. |
| Role changes | Every change is written to `audit_logs` (`role.change`) by the data layer; shown in `/admin/security`. |

## 2. Input and output

- Form input is validated on the server with **zod** (`lib/admin/validate.ts`): lengths, ISO dates, enum choices, UUIDs,
  `https://` URLs only, NUL bytes stripped.
- Content is stored and rendered as **plain text** (React escapes it; no `dangerouslySetInnerHTML` anywhere). Tested with a
  `<script>`/`onerror` payload. DOMPurify is not installed because no user HTML is rendered — add it with any rich-text feature.
- External links: `rel="noopener noreferrer nofollow"`.

## 3. Uploads (R2 bucket `utd-council-media`, private)

- The browser checks magic bytes (JPEG/PNG/WebP only), then makes the WebP sizes 1920/960 (watermarked) + 480 + a blur
  placeholder. Re-encoding drops EXIF/GPS.
- Upload URLs are issued only after `authorize()`. They are valid **5 minutes** and bound to one key `pending/<own user id>/<random uuid>/<w>.webp`, type `image/webp` and the exact byte size (≤ 10 MB).
  In production they are presigned R2 S3 URLs (aws4fetch). Without R2 keys, the browser uploads to `/api/upload` with an HMAC-signed query carrying the same limits.
- Finalize (server) checks all three files: they exist, are ≤ 10 MB, the **magic bytes and WebP header** are valid, and the size matches what was declared.
  Otherwise the files are deleted, the event is logged and the user sees "not a supported image".
- Approval **moves** files `pending/` → `public/`; deleting removes them from R2. Public files are served only by the Worker at `/media/public/photos/<uuid>/<w>.webp` (strict path pattern, `nosniff`).
  Unapproved files are served only with a 10-minute HMAC signature that is issued just for rows the caller may open.

## 4. Requests

- CSRF: Server Actions reject cross-origin posts (Next.js `Origin` check). Route handlers that change state check the same
  origin. Auth.js uses its own CSRF token. The voice form needs a short-lived HMAC token and Turnstile.
- Client IP = `cf-connecting-ip` (set by Cloudflare; `x-forwarded-for` is ignored).
- Rate limits: pages 600/min and API 60/min per IP (Workers Rate Limiting binding; generous because a school shares one NAT address);
  sign-in 5/15 min, voice 3/10 min and uploads 60/10 min (D1 counter). Honeypot/scanner paths ban the IP for 1 h (KV TTL).
- **Sign out on every device**: `/admin/security` → deletes all of the account's sessions in D1.

## 5. Headers (`proxy.ts`, `next.config.ts`)

| Header | Value |
|---|---|
| Content-Security-Policy | per-request **nonce**, `'strict-dynamic'`; no `unsafe-inline` / `unsafe-eval` for scripts; `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`; `connect-src` adds the R2 S3 origin only when presigned uploads are on |
| Strict-Transport-Security | `max-age=63072000; includeSubDomains; preload` |
| X-Content-Type-Options | `nosniff` |
| Referrer-Policy | `strict-origin-when-cross-origin` |
| Permissions-Policy | camera, microphone, geolocation, interest-cohort off |
| Cross-Origin-Opener-Policy / -Resource-Policy | `same-origin` / `same-origin` |
| X-Frame-Options | `DENY` |

Known exception: `style-src-attr 'unsafe-inline'`. The animation library writes `style=""` attributes; it allows no `<style>` and no script.

## 6. Errors and monitoring

- Production errors show a generic message plus a **reference code** (Next.js `digest`, also in the Worker log —
  `observability` is on in `wrangler.jsonc`, view under Workers → utd-student-council → Logs).
- `security_events` (D1) records:
  - trap paths, blocked tools/bots and rate limits
  - unauthenticated writes, denied actions and rejected uploads
  - sign-ins (allowed/refused by domain) and global sign-outs

  IPs are stored only as salted hashes, and the same event is stored at most once a minute per source.
- `/admin/security` (admin only): 7-day summary, recent events, role changes.

## 7. Secrets and dependencies

- Secrets live only in Cloudflare (`npx wrangler secret put`) and locally in `.dev.vars` (gitignored). `wrangler.jsonc` `vars` hold public
  values only (checked by `security:check`). `.env.example` has no real values.
- Pre-commit hook `scripts/secret-scan.mjs` (enabled by `npm install`) blocks key-shaped strings, env files and known values. `--build` mode scans the browser bundle.
- GitHub secret scanning + push protection stay **on**. Dependabot: npm weekly, GitHub Actions monthly.
- `npm audit --omit=dev --audit-level=high` must be clean. It is, after an override pins `glob` ≥ 10.5 inside OpenNext's minifier.
  Dev-only advisories (lint/test tooling, never shipped) are listed by `security:check`.

## 8. What `security:check` proves

| Check | How |
|---|---|
| only the data layer queries D1 | static scan of app/lib/components/proxy |
| every access rule (public/council/staff/admin, IDOR, review, roles, sessions, rate window) | vitest on a real D1 |
| headers, 401 without session, another's row → 404, anonymous sees no pending rows/files, `<script>` as text, `.html`→`.jpg` rejected (browser + server), sign-in redirect + cookie flags, sign out everywhere | Playwright on workerd |
| public-only wrangler vars, `.dev.vars` gitignored | config check |
| no secret in `.next/static` / `.open-next/assets` | bundle scan |
| dependencies | `npm audit` |
