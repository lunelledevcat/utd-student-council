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

## Theme removed, Thai / English (2026-10-19)
- Dark mode and the theme toggle are gone: one light theme (`color-scheme: light`), no `dark:` classes, no stored theme.
- next-intl 4, `localePrefix: "always"`: `/` -> `/th` (default) or the `NEXT_LOCALE` cookie's language; `/th/...`, `/en/...`.
  Route handlers (`/api`, `/auth`) and the honeypot stay unprefixed. `proxy.ts` runs the next-intl middleware after the
  existing trap / UA / rate-limit checks and passes the nonce request headers through; PRIVATE / NOINDEX / login rate-limit
  regexes accept the locale prefix. Old section URLs redirect with or without a prefix.
- **Live switch on public pages.** Both message bundles and both languages of the content are sent to the browser;
  the switch swaps the client provider's locale, updates the URL with `history.replaceState` (keeps `?tab=&year=`), sets
  the cookie and `<html lang>`. A real navigation would remount everything under `[locale]` and lose the open tab, popup
  and scroll position. Visible text on public pages therefore lives in client components (`useTranslations`).
  Back office / sign-in pages are server-rendered and switch with a normal navigation.
- Switch animation: visible `[data-swap]` blocks blur + fade + rise out and back in, staggered top to bottom (~400 ms total,
  Web Animations API, opacity only with reduced motion). Hero headline swaps word by word through a mask
  (Intl.Segmenter for Thai). Popups switch in place; since the backdrop covers the header, the popup header has its own
  TH | EN switch. There is no separate mobile menu in this design — the header switch shows on phones too.
- Content: optional English columns (migration 0003: `title_en`, `body_en`, `role_title_en`, … ; timeline steps may carry
  `text_en`). Missing English -> Thai text + small "TH" label (`<Tx>` / `useL()`); search matches both languages.
- Dates via Intl: th `16 ต.ค. 2569` (Buddhist calendar), en `16 Oct 2026`. Year: th "ปีการศึกษา 2569",
  en "Academic Year 2026 (2569)"; the year select shows `2569` / `2026 (2569)`.
- SEO: per-locale `generateMetadata`, `alternates.languages` (hreflang) on pages, `Link` hreflang headers from the
  middleware, sitemap lists both languages with alternates.
- Fonts: kept Kanit (headings) + IBM Plex Sans Thai (body) for English too. Plex Sans Thai's Latin glyphs are IBM Plex
  Sans and Kanit has its own Latin set, so the pair already matches and switching language never swaps fonts (no
  reflow from font loading, no extra download).
- `npm run i18n:check` (scripts/check-i18n.mjs) fails on keys missing in either file, empty values, or placeholder typos.

## Back office (2026-10-19)
- `/[locale]/dashboard`: overview (counts / pending per type for a year), one list + form per content type
  (announcements, activities, policies, members, advisors), `/dashboard/hero` (staff: approved photos -> banner + order),
  `/dashboard/years` (admin: add a year, optionally copy last year's structure as *pending* rows; set current year).
- Forms are generated from `lib/admin/entities.ts`; translatable fields have a ไทย / English tab (both inputs stay in
  the form, the tab only toggles visibility). English is optional everywhere. Timeline English = one line per Thai step.
- Writes use the signed-in user's session client, so RLS + `lock_review_columns` keep council rows `pending`;
  approve/reject/hide, photo publishing, years and hero use the service role only after a role check in the action.
  Approving a row also publishes its photos (copied pending -> public bucket).
- Photo upload: signed upload URL to the private bucket -> server re-encodes with sharp (EXIF stripped, 480/960/1920 webp
  + blur) -> `photos` row `pending`. Limit 60 uploads / 10 min per user.
- Back-office pages are server-rendered; their language switch is a normal navigation.
- **Not exercised in a browser:** without Supabase env vars the dashboard redirects to sign-in, so only build/typecheck
  and the redirect were verified. Test with a real project before handing it to the council.
- `supabase/seed.sql` regenerated for the new schema (`node scripts/gen-seed.mjs`).

## Layout bug fixes + school banner (2026-10-19)
Measured with `npm run check:layout [url] [outDir] [label]` (scripts/check-layout.mjs: real headless Chrome over CDP at
1366/1440/1920/390; horizontal overflow incl. every frame of a tab switch, CLS while scrolling, card alignment, number
of tab highlights, sticky-bar position). Before/after screenshots + JSON in `C:\dev\utd-shots\compare\bugfix`.
- Before (prod build): 390 px page widened to 414 px during tab switches (panel slides ±40 px) -> horizontal scroll;
  CLS 0.019 (1440) / 0.153 (390) because the sticky bar changed height when it stuck (labels -> sr-only, ⓘ note hidden).
- Fixes: `overflow-x: clip` on html/body (clip keeps `position: sticky` working); the sticky bar never changes size;
  the ⓘ note is always shown, below the sticky part; tab highlight = one `layoutId` element rendered inside the active
  tab (server-rendered, nothing to measure, no flash) and the page jumps to the content *before* the tab changes so the
  layout animation is not skewed by scrolling; announcement grid `auto-rows-fr` + fixed footer row height so "อ่านต่อ"
  lines up on every card.
- After: all four widths pass (no overflow, CLS ≤ 0.0002, 1 highlight, sticky top constant, cards aligned), /th and /en.
- Port 3000 was taken by another process during this work (likely your own dev server), so measurements ran on
  `next start -p 3100`. The video's dev server may run older code — restart it to see these fixes.

### Banner photos
- 8 photos from the school's website (https://utd.ac.th/main/, WordPress media; the site footer states CC BY-NC 4.0),
  picked from 99 large landscape JPEGs: building, assemblies, ceremony, Open House 2020, Thai dance, group photo.
  Excluded posters/announcements and the WordPress theme's stock demo images (`demo-*`, `*unsplash*`).
- Stored in `public/banner/utd-NN-{1920,1280,768}.webp` (no hotlinking), sources in `public/banner/SOURCES.md`.
  Each slide shows the credit "ภาพ: โรงเรียนอุตรดิตถ์ / Photo: Uttaradit School".
- Migration 0004 + seed register them as approved `photos` rows (`static_path`, `credit = 'school'`, `is_hero`), so
  `/dashboard/hero` hides / reorders / deletes them like uploads (delete removes the row; the file stays in the repo).
  Local dev without Supabase uses `content/banner.json`. The generated sample slides were removed.
- More recent activity photos are on the school's Facebook page (https://www.facebook.com/utd.ac.th) — not fetched
  automatically (platform terms). Download any you want by hand and upload them in the back office.
- The photos show students; they were already published publicly by the school, but check with the school before launch.

## Hero without text, gradient background, one icon/illustration set (2026-10-19)
- Hero shows only the photos, arrows and dots; the navy overlay, year badge, headline and petals are gone (a light
  shadow at the bottom keeps the dots visible). Council name stays in the header, year in the control bar. Unused hero
  messages removed (`hero.line1/line2/sub`, `year.badge`); the header's other-language line uses `site.nameTh`.
- Page background: mesh of radial gradients (#DCE8FF top-left -> white -> #FDE4EE bottom-right) on a fixed
  `body::before`, drifting over 26 s with `transform` (composited; animating background-position would repaint the whole
  screen every frame on phones). Off with reduced motion. Cards / control bar stay white with thin borders.
- Contrast (WCAG): muted text #5a6480 = 4.77:1 on #DCE8FF, 4.91:1 on #FDE4EE, 5.88:1 on white. Pink #E8508B was only
  3.53:1 on white, so pink **text** now uses `pink-ink` #C2185B (5.87:1 white, 4.76:1 #DCE8FF); pink fills/borders and
  large white-on-pink button text are unchanged (large-text rule).
- Icons: one `<Icon name>` (components/icons/Icon.tsx) — Phosphor duotone (MIT) with the fill layer recoloured pink in
  CSS, Facebook/Instagram from Simple Icons (CC0). Small bounce/tilt on hover of the surrounding link/button/card
  (off with reduced motion). The old `IconX` names are aliases of `<Icon>`, so call sites did not change.
- Illustrations: drawn in-house instead of unDraw (no download / re-colour / licence tracking; matches the mandapa and
  Kae Farang motifs): empty state, 404, pending access, login, photo / portrait placeholders, plus faint mandapa and
  Kae Farang line art in section corners and text cards. SVGO-optimised (`npm run svg:optimize`), licences in
  `public/illustrations/LICENSES.md`.
- Checked with `npm run check:layout` at 1366/1440/1920/390: no horizontal overflow (also during tab switches),
  CLS ≤ 0.004. Screenshots in `C:\dev\utd-shots\compare\bg-svg`.
