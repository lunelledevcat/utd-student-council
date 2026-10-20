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

## Env setup page, admin outside the school domain (2026-10-19)
- One source for env help: `lib/env-spec.ts` (names, public/secret, test-value rules, links) + `messages/*.json`
  `setup.vars.*` (purpose / where / missing in dev vs production). It drives `/admin/setup`, the `next dev` warning
  (`instrumentation.ts`, names only) and `npm run env:docs`, which writes `.env.example` and the README section.
  `.env.example` is now committed (`!.env.example` in .gitignore) and contains example values only.
- The old `.env.example` held real keys (never committed — `.env*` was ignored). They were moved into `.env.local`
  with backups `.env.example.old` / `.env.local.bak` (both ignored; delete them when you're sure). Corrected on the way:
  `SUPABASE_URL=…/rest/v1/` -> `NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co`, and the Upstash `rediss://` TCP URL
  -> the `https://` REST URL. `NEXT_PUBLIC_SUPABASE_ANON_KEY` was not in the old file and is still missing.
- `/admin/setup` (admin only, inside the back-office shell; `/admin` redirects there): ✅ set / ⚠️ test value / ❌ missing
  per variable, never the value. Google sign-in status comes from Supabase's public `/auth/v1/settings`.
- Sign-in rule (`canSignIn` / `roleFor` in lib/env.ts, used by `getSession` and `/auth/callback`): Google-verified
  address (`email_verified` claim) on ALLOWED_EMAIL_DOMAIN, **or** listed in ADMIN_EMAILS (trimmed, lower-case) — the
  only exception. A role stored as "admin" in the DB is ignored; only ADMIN_EMAILS grants admin. The `hd` hint was removed
  from the Google request (it hid non-school accounts, so an admin's gmail could not be chosen).
- `npm run test:auth` checks these rules (10 cases: admin gmail -> /admin, other gmail -> bounced, school address without
  role -> /pending-access, unverified, look-alike domains…). The real Google round trip was not exercised here:
  it needs the anon key and the Google provider configured in Supabase.

## Back office on the real database (2026-10-19)
`npm run test:e2e` — Playwright against the real Supabase project with two throw-away accounts
(e2e-admin@ / e2e-council@utd.ac.th, created confirmed by the service role in global setup, signed in with a real
session cookie produced by @supabase/ssr, deleted with everything they created in teardown). The test server is a
local `next start` with test-only overrides: the e2e admin is added to ADMIN_EMAILS and Cloudflare's always-pass
Turnstile test keys are used. No auth code path is special-cased for tests.
Covered: announcements (create, edit while pending, approve -> on site, reject with reason, delete), activity with
2 uploaded photos (pending files private, approve copies 480/960/1920 to the public bucket, site shows them, hero
toggle, delete removes row + files), policy TH/EN (approve, /th + /en page, staff edit, delete -> 404), members with
and without IG consent, advisors, academic year with copy, /admin/setup (admin only, no secret values in the HTML),
voice form + status lookup.
Bugs found and fixed:
- **No review ever stuck.** `lock_review_columns()` trusted only `is_staff()` (auth.uid()), but reviews, photo
  publishing and hero changes run with the service role (after the app's role check), whose auth.uid() is null —
  the trigger silently reset them to pending. Migration 0005 trusts the service role / direct DB sessions.
- **ADMIN_EMAILS admins were nobody in the database.** RLS reads profiles.role; admins from the env list had none,
  so they could not see others' pending rows. `resolveRole` now keeps profiles.role in step with ADMIN_EMAILS
  (promote when listed, demote a stored admin when removed — also at DB level, so a removed admin's token loses staff
  rights against the REST API).
- Deleted photos: removed from the buckets (verified), but Supabase's CDN can keep serving a cached public copy for up
  to the object's cache time (1 h default).
Timing before speed work (local, 10 × 2400×1500 JPEG): upload 10 photos 56.7 s, save form 5.6 s.

## Back office: date picker, fast uploads, comfort features (2026-10-19)
- `<DatePicker>` (react-day-picker 10 + its th/en locales) replaces every date input: Thai month + BE year
  (ตุลาคม 2569) / EN CE, weekday row อา จ อ พ พฤ ศ ส, selected = pink circle, today = navy ring, hover sky; month/year
  dropdowns, arrows, shortcuts วันนี้/เมื่อวาน/สัปดาห์ที่แล้ว + ล้าง; typed dates accepted ("19 ต.ค. 2569", "19/10/2569",
  "2026-10-19"); stores ISO in a hidden input; popover scale+fade, ESC/outside click; bottom sheet on phones.
- Form: fields grouped in cards (content / details / photos / contact, derived from field kind — config unchanged),
  equal-height inputs, red errors under fields, sticky action bar: ส่งอนุมัติ (staff: บันทึกและเผยแพร่ = save + approve),
  บันทึก (stays), บันทึกและเพิ่มอันใหม่, ทำซ้ำรายการนี้ (`/new?from=<id>`, text only, slug gets -copy).
  Ctrl+S = save, Ctrl+Enter = submit. Draft auto-saved to localStorage every 3 s, "กู้คืนร่าง" after reload/close.
- Optimistic: submitting jumps to the list at once with a "กำลังบันทึก…" row and a toast when the server confirms;
  on failure a toast links back to the form (draft kept). The action request starts before navigating
  (an action posts to the current URL; the list route does not carry the form's action).
- Uploads: browser-image-compression -> WebP <= 1920 px on the main thread (its web-worker mode loads a script from a
  CDN, which the CSP blocks) -> direct PUT to a signed URL (XHR progress), 3 in parallel, cancel/retry per photo,
  drag & drop, paste (Ctrl+V), drag to reorder (motion Reorder). Server registers the row at once; variants
  (1920/960 watermarked "© UTD Student Council", 480, blur) are built with `after()`; approval builds them first if the
  background job has not finished. Deleting a whole activity/policy now also removes its photo files.
- Lists: 20 per page, debounced search (?q=, title TH/EN), next page prefetched; staff select rows + approve together,
  keys J/K move, X select, A approve, R reject; public pages revalidated after every review.
- E2E: 14 tests (backoffice + features + perf) pass against the real project.
- Timing (local `next start`, 10 × 2400×1500 JPEG, same machine/network):
  upload 10 photos **56.7 s -> 25.9 s**; save until the server confirms **5.6 s -> 2.5 s** (the list shows the item
  immediately). Screenshots: `C:\dev\utd-shots\compare\backoffice`.

## Language menu + covered switch (2026-10-19)
- Globe button (Phosphor Globe duotone, 40 px glass) + current code (TH/EN) opens a menu (scale + fade from the
  corner): flag (flag-icons, MIT, inlined SVG so it never waits for an image) + name + code; current one ticked on
  light pink; hover light-blue gradient; ↑/↓, Enter, ESC; aria-haspopup / aria-expanded / menuitemradio.
  Phones: a menu button in the header holds the two language choices + socials. Popups: a compact TH/EN choice in
  their header (the panel clips overflowing menus).
- Switch (~900 ms): navy overlay 85 % + blur fades in (250 ms), globe spins once, "Switching to English…" /
  "กำลังเปลี่ยนเป็นภาษาไทย…" (in the target language); behind it the locale is swapped in place and the URL updated
  with history.replaceState; then it waits for the new text to be painted (document.fonts.ready + 2 frames — not a timer),
  fades out (300 ms) while [data-swap] blocks rise 8 px, top to bottom. Reduced motion: short overlay fade only.
  Clicks during a switch are ignored (button disabled).
- Deliberate deviation: the brief says `router.replace`; a real navigation to /en remounts everything under [locale],
  which would close an open popup and reset scroll — both of which the same brief requires to survive. The in-place swap
  + replaceState gives the same URL and history entry without that. Back office / sign-in pages (server-rendered) still
  navigate (behind the overlay).
- Header no longer clips its children (only the decorative glow is clipped), so the menu can drop below it.
- All external links: rel="noopener noreferrer nofollow".

## Security hardening (2026-10-19) — details in SECURITY.md
- `authorize()` in lib/auth.ts is the single action/route check; zod validation in lib/admin/validate.ts (https-only URLs).
- IDOR fix: council could attach any *approved* (public) photo id to their own row; now only own uploads / photos already
  on that row (staff unrestricted).
- Uploads: magic bytes checked in the browser and on the server (WebP + sharp decode), bad files deleted + logged;
  pending bucket WebP-only; preview signed URLs 10 min.
- Cookies HttpOnly/Secure/Lax; POST to private paths without a session -> 401; COOP/CORP headers; global sign-out.
- Migration 0006: security_events (RLS, no policies), role-change audit trigger, bucket mime.
- /admin/security: 7-day summary, recent events, role changes, sign out everywhere. Error page shows the digest as a
  reference code.
- Pre-commit secret scan (.githooks, enabled by `npm install` via prepare), Dependabot, `npm run security:check`
  (21 checks, all pass). Not done: DOMPurify (no HTML is rendered anywhere — React escapes; add with any rich text),
  `style-src-attr 'unsafe-inline'` kept for animation style attributes.
- E2E: 20 tests (backoffice 8, features 5, lang 2, security 5) pass.

## Real 2569 data (2026-10-20, main)
- Sources in `_import/` (gitignored): SCC.pdf, brander/IMG_6115|6116|6118.pdf, members-2569.json, logos. Images are
  taken out of the PDFs as embedded (JPEG bytes / raw pixels) — never re-drawn or edited (`scripts/import-2569.mjs`).
- Members: `content/members-2569.json` (names + roleKey; titles TH/EN in messages `people.titles`), seeded by
  `scripts/seed-2569.mjs` (fixed ids, re-runnable, never overwrites consent / IG). Cards grouped chair -> 4 vice -> heads.
- Portraits: card = head-and-shoulders box (320,200,440x550) — clean on all 16 pages (no frame/logo/text; the poster's
  photo-collage background stays); popup = whole poster 720x900. AVIF + WebP, all < 80 KB. Stored in the PRIVATE bucket
  (`pending/members/2569/NN-*`): the repo is public, and photos must not be reachable without consent. `consent_photo`
  (null = awaiting, default) -> /dashboard/consent (admin): per person on/off, "show all" asks twice + server checks the
  count; on = copy to the public bucket, off = remove from it.
- Banner 02: the 3 delivered files are council group photos (2048x1365, 1574x1040, 6240x4160 ≈ 1.5:1) — not the
  "SCUTD 2026" / memorial artwork described, so all three are registered OFF (hero order 2–4; 1 kept for banner 01).
  Banner slides (`/banners/`) show the whole image (contain + own blurred fill), no zoom, nothing over them, credit under
  the frame. Hero rows have a show window (hero_start/hero_end) editable on /dashboard/hero.
- Channels: `lib/site.ts CHANNELS` (FB share link, IG utd_scc pending confirmation vs utd_stdcc, TikTok utd.sc).
- Logos: council logo black background removed by flood fill from the edges only (outlines kept); favicon.ico, icon,
  apple-icon, OG image generated. No SVG: tracing a raster emblem would change it — an official vector file is needed.
- Migrations 0007 (columns, window, lock), 0008 (AVIF in buckets), 0009 (anon column grant for the new member columns).
- Lighthouse /th (mobile, local): before 81–83/96/100/92 CLS 0 · after 83/97/100/92 CLS 0; council tab 81/100/100/100;
  banner test page CLS 0.

## 2569 members, second import (2026-10-20, main)
- New `_import/members-2569.json` (built from SCC.pdf + เว็ปไซต์สภานักเรียน.pdf; the PDF itself was not in _import, so
  the JSON is the only source used). `content/members-2569.json` regenerated: name (as in the council's document),
  nickname, role (displayed as written), deptKey, partyKey, instagram (validated `^[A-Za-z0-9._]{1,30}$`), group,
  nameFromPoster / roleFromDoc (review only: migration 0010 columns, not in the anon grant, shown on /dashboard/consent).
- EN: `people.titles` (Chairperson of the Student Council, Vice Chairperson for …, Secretary, Treasurer, Head of …),
  `people.depts`, `people.parties`. Names stay Thai (no transliteration, no "TH" badge on names).
- IG: stored for all 16, shown only while consent_public is on (per person switch + "แสดง IG ทั้งหมด", asked twice) —
  the source note says the handles still need each person's confirmation.
- Card: name (nickname) + role, no party pill; popup rows nickname / position / department / party (plain text) + IG button.
- Photos: SCC.pdf unchanged (same file, same 16 pages), crops from the first import reused. Photo consent was switched on
  for everyone by the admin account on 2026-10-20 02:19 UTC ("เปิดทั้งหมด").
- Banners now FILL the frame (object-cover + per-slide focal point, photos.focal) instead of contain; desktop frame 16:7
  (≈2.3:1, was 16:5); widths 640/1280/1920/2048 (2K). banner-02-2's original is only 1574 px — not upscaled.
- Lighthouse /th mobile: 80–81 (base 81–83) — within run-to-run noise (TTFB to Supabase 1.4–2.1 s locally); CLS 0.000
  on /th, council tab (TH/EN 80–82 / 100 / 100 / 100) and the banner test page.
