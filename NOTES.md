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

---

# Redesign v2 (2026-10-18) — single page + tabs + popups

Replaces section 4 (pages) of the original brief. Everything else (security, auth, review flow) kept.

## Reference analysis (REA, https://pnr-student-council.vercel.app/)
Captured with REA `capture_browser_scenario` (Chrome, 1440 wide, th-TH). Shots + DOM in `C:\dev\utd-shots\ref-analysis\`.
Behaviour only was studied; no code, images, text or logos were copied.
- Stack: static HTML + Bootstrap 5 + Font Awesome, data from one Google Apps Script JSON endpoint
  (`?type=api&year=latest`) -> skeleton shimmer while loading (~5-10 s), welcome modal on first load.
- Header navy gradient: 2 round logos + Thai name + English name; Facebook / Instagram pill buttons right.
- Banner: rounded 16:5 Bootstrap carousel (fade), pill indicators bottom-centre, optional "open link" chip per slide.
- Control card: year `<select>` (server returns available years, default latest), search box (300 ms debounce),
  pill tabs (activities / election roster / operation roster / advisors). Tab NOT stored in URL.
- Tab 1: "ประชาสัมพันธ์" grid of cards (cover, pin icon top-right, date, title + link chip, 3-line excerpt) -> modal
  (navy header + close, title, date, image, text, outlined "open related link" button).
  "ภาพผลงาน" = full-width 16:5 cards, each an auto-rotating carousel of the activity's photos, caption under (date + title)
  -> modal with navy header (title) + long text only (no gallery in the modal).
- Roster tabs: 4/3/2-column grid, portrait on sky-blue photo, crown badge (president) / medal (vice), name, position,
  party chip; president card gets a gold bottom border. Sorted by a rank column. Operation tab groups by department.
- Profile modal "ข้อมูลแนะนำรายบุคคล": photo left (5/12), right: name, nickname, election position, operation position,
  department, party, education status, contact box.
- Advisors: heading + same card with "ที่ปรึกษา" badge, subject group, "ครู<nickname>" chip; modal adds year + contact.
- Search filters roster/advisor tabs (name, nickname, positions, dept, party); empty -> "not found" box + clear button.
- Footer navy centred copyright; round scroll-to-top button bottom-right.

## Decisions (v2)
- Sketches `C:\dev\utd-shots\ref\sketch-1.png` / `sketch-2.png` were **not found** on disk -> built from the written brief only.
- Welcome modal of the reference is **not** reproduced (not in the brief; it delays first use).
- The reference's separate "election" and "operation" roster tabs are merged into one tab ③ (brief); a member has both
  `role_title` (ตำแหน่ง วาระ) and `exec_title` (ตำแหน่งผู้บริหาร) and a `dept` (สังกัดฝ่าย), shown in the popup.
- Search covers every tab at once; each tab label shows its hit count while a query is active.
- Tab + year live in the URL (`/?tab=news|policy|council|advisor&year=2569`); default tab omitted from the URL.
- Old routes (/news, /events, /members, /council, /policies) redirect to the matching tab. `/voice` stays (existing feature),
  linked from the footer.
- IG / contact of a member or advisor is only sent to the browser when `consent_public` is true (filtered server-side).
- Gallery modal for activities is an addition over the reference (brief).

## Home fixes (2026-10-19)
- Hero = full-frame photo slider (mandapa graphic removed): Ken Burns + crossfade, 6 s autoplay paused on hover/focus/drag,
  mouse drag + touch swipe + ←/→ keys (when the banner has focus), glass arrows (hover on desktop; small, bottom row on phones
  so they never cover the headline), pink pill dots bottom-centre. No hero photo -> one gradient slide.
- `public/sample/hero-{1,2,3}-{480,960,1920}.webp` are **generated abstract placeholders** (labelled "[รูปตัวอย่าง n]"),
  used only when Supabase is not configured. Delete them once real approved hero photos exist.
- Photos are optional for announcements, activities and policies: no photo -> text card (icon, date/status, title, 2-line
  excerpt). Activity/policy cards with photos span the full row (reference); text cards share rows of 3.
  Portrait cards (council/advisors) keep the portrait placeholder.
- Bug fixes: card entrance moved off the layout-animated <li> (cards no longer stop mid-rise); tab highlight is measured
  inside the tab list (a layoutId pill inside the sticky bar drifted out of the frame while scrolling); search placeholder
  "ค้นหา..."; tab panel height is held during tab/year switches (no footer jump); year select shows the number only.
- Prod build (`next start`) shows no console errors. The CSP "inline style" errors seen earlier happen in `next dev` only.
- REA screenshots appear to freeze CSS keyframe animations (petals sit at the top in every capture while JS-driven
  animations run) — petal fall was not verified in a capture.
- `gsap` removed (no longer used).
