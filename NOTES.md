# NOTES — decisions made while building

Decisions taken without asking, so you can overrule them.

## Design / Figma
- Figma file `UTD Student Council Website` (key `upIkh923glw3089Duk09Vl`): tokens + Home Desktop 1440 only.
  Starter plan limits: 3 pages, 1 mode per variable collection (so Light/Dark are two collections), and an MCP call quota
  that ran out. **Not done in Figma yet:** Components with variants, Mobile 390, Prototype/animations.
- Home layout follows the Figma hero (gradient navy-deep -> navy-mid, 3-layer mandapa, petals, gold badge, 2 CTAs).
- The mandapa is a **stylised stepped silhouette** (`MANDAPA_PATH` in `lib/site.ts`), not the official artwork — replace it.
- Inner pages start with a dark `PageHero` band so the white-on-glass navbar stays readable.

## Placeholders (nothing invented)
Council logo, school crest, member names/photos, term year (`SITE.term`), slogan, policies, stats numbers (sample values
12/24/386/18), president quote, socials, map, room location. All marked `[...]` in the UI. Symbol meanings (crest / colours /
Kae Farang) are placeholders too.

## Accessibility
- Pink `#E8508B` with white text is 3.6:1 (fails AA for normal text). Every pink button uses Kanit 600 at >= 17-18px so it counts as
  large text. Small pink-on-white text is avoided; pink is used for accents/borders/dots.
- `prefers-reduced-motion`: petals hidden, marquee static, reveal/parallax/timeline draw/flip 3D/tilt/magnetic/ripple disabled.
- Dark mode: `[data-theme]` (toggle in navbar) or OS preference. In dark, `--c-brand` is lifted to navy-500 so filled elements still
  stand out from the navy surface. Tailwind `dark:` variants are NOT used (they would ignore the manual toggle).

## Tech
- Next 16 -> `proxy.ts` (renamed middleware). Removed scaffold `cacheComponents`/`partialPrefetching`: a per-request CSP nonce needs
  dynamic rendering, so the root layout is `force-dynamic`. Tradeoff: no static HTML caching; use CDN caching for assets only.
- CSP: nonce + `strict-dynamic` for scripts. `style-src-attr 'unsafe-inline'` is allowed because motion/GSAP write inline `style=""`
  (scripts stay nonce-locked). Map iframe not embedded -> no `frame-src` for it; add one when you embed a map.
- Content is JSON in `content/` read only in server code (`lib/content.ts` imports `server-only`). The small policy/member lists are
  passed as props to client filters (they are public by design: name/role/grade only).
- Voice storage = Supabase PostgREST via plain `fetch` (no SDK). Dev fallback writes `.data/voice.jsonl` (gitignored).
- Preloader shows once per session (sessionStorage); the SSR overlay is visible until hydration decides to hide it.
- Page transition = `template.tsx` enter animation only (App Router cannot animate exit without hacks).
- Honeypot route `/_hp/directory` is linked invisibly from the footer; disallowed in robots.txt; hitting it (or `/.env`, `/wp-login.php`
  ...) bans the IP for 1 hour.
- `next dev` shows `'unsafe-eval'` in CSP only in development.

## Limits (do not oversell)
Protection raises the cost of scraping; it cannot stop a determined scraper. In-memory rate limiting is per-instance — use Upstash in
production. Headless browsers that spoof a normal UA are only slowed by rate limits + Turnstile. UA blocking can be bypassed by
changing the header.
