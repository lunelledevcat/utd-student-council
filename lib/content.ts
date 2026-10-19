import "server-only";
import banner from "@/content/banner.json";
import seed from "@/content/seed.json";
import { supabaseConfigured } from "@/lib/env";
import { adminClient } from "@/lib/supabase/admin";
import { publicClient, publicImageUrl } from "@/lib/supabase/public";

// Public content, scoped to one academic year. With Supabase configured it comes from approved rows
// (RLS: anon sees status='approved' only, and never the instagram/contact columns); without it (local dev)
// content/seed.json — same row shape as the tables — is used so the site still renders.
// Everything here is public by design and small (one year of one school council), so a year is sent to the page
// in one piece, in both languages, and tabs / search / language switching run client-side.

/** Text in Thai (always) and English (optional — null = not translated, the UI falls back to Thai with a "TH" label). */
export type L<T = string> = { th: T; en: T | null };
export type Img = {
  id: string; w: number; h: number; blur: string | null; src: { 480: string; 960: string; 1920: string };
  /** optional AVIF srcset (served through <picture>, WebP stays the fallback) */
  avif?: string;
};
export type Announcement = { id: string; title: L; date: string; body: L<string[]>; link: string | null; pinned: boolean; cover: Img | null };
export type Activity = { id: string; title: L; date: string; body: L<string[]>; photos: Img[] };
export type PolicyStatus = "planned" | "in-progress" | "done";
export type TimelineStep = { date: string; text: L };
export type Policy = {
  id: string; slug: string; title: L; summary: L; body: L<string[]>; status: PolicyStatus; progress: number;
  owner: L; timeline: TimelineStep[]; cover: Img | null; photos: Img[];
};
export type Contact = { instagram: string | null; contact: string | null };
export type MemberGroup = "executive" | "head" | null;
export type Member = {
  id: string; name: L; nickname: L; role: L; termNo: string; execTitle: L; dept: L; party: L; photo: Img | null; rank: number;
  group: MemberGroup;
  /** whole introduction poster, for the popup (same consent rule as photo) */
  poster: Img | null;
} & Contact;
export type Advisor = { id: string; name: L; nickname: L; role: L; subject: L; position: L; photo: Img | null } & Contact;
export type YearContent = {
  year: number; years: number[]; current: number;
  announcements: Announcement[]; activities: Activity[]; policies: Policy[]; members: Member[]; advisors: Advisor[];
};
/** Hero slide: either an uploaded photo (storage variants) or a banner file shipped in public/banner. */
export type Photo = {
  id: string; w: number; h: number; blur: string | null; src: string; srcSet: string; avifSet: string | null;
  caption: string; alt: L | null; credit: "school" | "council" | null;
  /** banner artwork shown exactly as delivered: no zoom, no overlay, whole image visible */
  plain: boolean;
};

const paragraphs = (s: string | null | undefined) => (s ?? "").split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
const l = (th: string | null | undefined, en: string | null | undefined): L => ({ th: th ?? "", en: en?.trim() ? en.trim() : null });
const lp = (th: string | null | undefined, en: string | null | undefined): L<string[]> => {
  const e = paragraphs(en);
  return { th: paragraphs(th), en: e.length ? e : null };
};
const one = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? v[0] ?? null : v ?? null);

type PhotoRow = { id: string; width: number; height: number; blur: string | null; sort_order?: number };
const IMG_COLS = "id,width,height,blur,sort_order";
const toImg = (r: PhotoRow | null): Img | null => {
  if (!r) return null;
  const p = (w: number) => publicImageUrl(`photos/${r.id}/${w}.webp`);
  return { id: r.id, w: r.width, h: r.height, blur: r.blur, src: { 480: p(480), 960: p(960), 1920: p(1920) } };
};
const sortedImgs = (rows: PhotoRow[] | null | undefined) =>
  [...(rows ?? [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)).map(toImg).filter((x): x is Img => !!x);

/** Only consented contacts leave the server. `@handle` is stripped to a bare IG handle. */
const contactOf = (consent: boolean, instagram: string | null | undefined, contact: string | null | undefined): Contact =>
  consent
    ? { instagram: instagram?.trim().replace(/^@/, "") || null, contact: contact?.trim() || null }
    : { instagram: null, contact: null };

// ───────────────────────── row -> view model (shared by seed and DB) ─────────────────────────

type Row = Record<string, unknown> & { id: string };
const s = (r: Row, k: string) => (r[k] as string | null | undefined) ?? "";

const toAnnouncement = (r: Row): Announcement => ({
  id: r.id, title: l(s(r, "title"), s(r, "title_en")), date: s(r, "published_on"), body: lp(s(r, "body"), s(r, "body_en")),
  link: (r.link_url as string | null) ?? null, pinned: !!r.pinned, cover: toImg(one(r.cover as PhotoRow | PhotoRow[] | null)),
});
const toActivity = (r: Row): Activity => ({
  id: r.id, title: l(s(r, "title"), s(r, "title_en")), date: s(r, "event_date"), body: lp(s(r, "body"), s(r, "body_en")),
  photos: sortedImgs(r.photos as PhotoRow[] | null),
});
const toPolicy = (r: Row): Policy => ({
  id: r.id, slug: s(r, "slug"), title: l(s(r, "title"), s(r, "title_en")), summary: l(s(r, "summary"), s(r, "summary_en")),
  body: lp(s(r, "body"), s(r, "body_en")), status: s(r, "progress_status") as PolicyStatus, progress: Number(r.progress ?? 0),
  owner: l(s(r, "owner"), s(r, "owner_en")),
  timeline: (Array.isArray(r.timeline) ? r.timeline : [])
    .filter((t): t is { date: string; text: string; text_en?: string } => typeof t?.date === "string" && typeof t?.text === "string")
    .map((t) => ({ date: t.date, text: l(t.text, t.text_en) })),
  cover: toImg(one(r.cover as PhotoRow | PhotoRow[] | null)), photos: sortedImgs(r.photos as PhotoRow[] | null),
});
/**
 * A member's photos are shown only with consent_photo = true (null = not asked yet). Poster files (photo_key) are in
 * the public bucket only while consent is on (lib/admin/consent.ts copies / removes them).
 */
const memberPhotos = (r: Row): { photo: Img | null; poster: Img | null } => {
  if (r.consent_photo !== true) return { photo: null, poster: null };
  const key = r.photo_key as string | null;
  if (!key) return { photo: toImg(one(r.photo as PhotoRow | null)), poster: null };
  const file = (kind: "card" | "poster", w: number, h: number): Img => {
    const webp = publicImageUrl(`${key}-${kind}.webp`);
    return { id: `${key}-${kind}`, w, h, blur: null, src: { 480: webp, 960: webp, 1920: webp }, avif: `${publicImageUrl(`${key}-${kind}.avif`)} ${w}w` };
  };
  return { photo: file("card", 440, 550), poster: file("poster", 720, 900) };
};

const toMember = (r: Row, contact: Contact): Member => ({
  id: r.id, name: l(s(r, "name"), s(r, "name_en")), nickname: l(s(r, "nickname"), s(r, "nickname_en")),
  role: l(s(r, "role_title"), s(r, "role_title_en")), termNo: s(r, "term_no"), execTitle: l(s(r, "exec_title"), s(r, "exec_title_en")),
  dept: l(s(r, "dept"), s(r, "dept_en")), party: l(s(r, "party"), s(r, "party_en")),
  rank: Number(r.sort_order ?? 0), group: (r.member_group as MemberGroup) ?? null, ...contact, ...memberPhotos(r),
});
const toAdvisor = (r: Row, contact: Contact): Advisor => ({
  id: r.id, name: l(s(r, "name"), s(r, "name_en")), nickname: l(s(r, "nickname"), s(r, "nickname_en")),
  role: l(s(r, "role_label"), s(r, "role_label_en")), subject: l(s(r, "subject_group"), s(r, "subject_group_en")),
  position: l(s(r, "position"), s(r, "position_en")), photo: toImg(one(r.photo as PhotoRow | null)), ...contact,
});

// ───────────────────────── years ─────────────────────────

export async function getYears(): Promise<{ years: number[]; current: number }> {
  if (!supabaseConfigured()) return { years: seed.years, current: seed.current };
  const { data } = await publicClient().from("academic_years").select("year,is_current").order("year", { ascending: false });
  const years = (data ?? []).map((r) => r.year as number);
  const current = (data ?? []).find((r) => r.is_current)?.year ?? years[0] ?? new Date().getFullYear() + 543;
  return { years: years.length ? years : [current], current };
}

// ───────────────────────── one year ─────────────────────────

export async function getYearContent(requested?: number): Promise<YearContent> {
  const { years, current } = await getYears();
  const year = requested && years.includes(requested) ? requested : current;
  const content = supabaseConfigured() ? await fromDb(year) : fromSeed(year);
  return { year, years, current, ...content };
}

type Lists = Pick<YearContent, "announcements" | "activities" | "policies" | "members" | "advisors">;
const bySort = (a: Row, b: Row) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0);

function fromSeed(year: number): Lists {
  const ofYear = (xs: Row[]) => xs.filter((x) => x.year === year);
  const rows = seed as unknown as Record<"announcements" | "activities" | "policies" | "members" | "advisors", Row[]>;
  const c = (r: Row) => contactOf(!!r.consent_public, r.instagram as string, r.contact as string);
  return {
    announcements: ofYear(rows.announcements)
      .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || s(b, "published_on").localeCompare(s(a, "published_on")))
      .map(toAnnouncement),
    activities: ofYear(rows.activities).sort((a, b) => s(b, "event_date").localeCompare(s(a, "event_date"))).map(toActivity),
    policies: ofYear(rows.policies).sort(bySort).map(toPolicy),
    members: ofYear(rows.members).sort(bySort).map((r) => toMember(r, c(r))),
    advisors: ofYear(rows.advisors).sort(bySort).map((r) => toAdvisor(r, c(r))),
  };
}

const ANN = `id,title,title_en,body,body_en,published_on,link_url,pinned,cover:photos!cover_photo_id(${IMG_COLS})`;
const ACT = `id,title,title_en,body,body_en,event_date,photos:photos!activity_id(${IMG_COLS})`;
const POL = `id,year,slug,title,title_en,summary,summary_en,body,body_en,progress_status,progress,owner,owner_en,timeline,sort_order,cover:photos!cover_photo_id(${IMG_COLS}),photos:photos!policy_id(${IMG_COLS})`;
const MEM = `id,name,name_en,nickname,nickname_en,role_title,role_title_en,term_no,exec_title,exec_title_en,dept,dept_en,party,party_en,sort_order,member_group,consent_photo,photo_key,photo:photos!photo_id(${IMG_COLS})`;
const ADV = `id,name,name_en,nickname,nickname_en,role_label,role_label_en,subject_group,subject_group_en,position,position_en,sort_order,photo:photos!photo_id(${IMG_COLS})`;

async function fromDb(year: number): Promise<Lists> {
  const db = publicClient();
  const [ann, act, pol, mem, adv] = await Promise.all([
    db.from("announcements").select(ANN).eq("year", year).order("pinned", { ascending: false }).order("published_on", { ascending: false }),
    db.from("activities").select(ACT).eq("year", year).order("event_date", { ascending: false }),
    db.from("policies").select(POL).eq("year", year).order("sort_order"),
    db.from("members").select(MEM).eq("year", year).order("sort_order"),
    db.from("advisors").select(ADV).eq("year", year).order("sort_order"),
  ]);
  for (const r of [ann, act, pol, mem, adv]) if (r.error) console.error("[content]", r.error.message);
  const contacts = await consentedContacts(year);
  const none = contactOf(false, null, null);
  const rows = (d: unknown) => (d ?? []) as Row[];
  return {
    announcements: rows(ann.data).map(toAnnouncement),
    activities: rows(act.data).map(toActivity),
    policies: rows(pol.data).map(toPolicy),
    members: rows(mem.data).map((r) => toMember(r, contacts.get(r.id) ?? none)),
    advisors: rows(adv.data).map((r) => toAdvisor(r, contacts.get(r.id) ?? none)),
  };
}

/** instagram/contact are not readable with the anon key; read them with the service role, consented + approved only. */
async function consentedContacts(year: number) {
  const out = new Map<string, Contact>();
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return out;
  const db = adminClient();
  const q = (t: "members" | "advisors") =>
    db.from(t).select("id,instagram,contact").eq("year", year).eq("status", "approved").eq("consent_public", true);
  const [m, a] = await Promise.all([q("members"), q("advisors")]);
  for (const r of [...(m.data ?? []), ...(a.data ?? [])]) out.set(r.id, contactOf(true, r.instagram, r.contact));
  return out;
}

// ───────────────────────── policy page ─────────────────────────

export async function getPolicyBySlug(slug: string): Promise<(Policy & { year: number }) | null> {
  if (!supabaseConfigured()) {
    const r = (seed.policies as unknown as Row[]).find((x) => x.slug === slug);
    return r ? { ...toPolicy(r), year: Number(r.year) } : null;
  }
  const { data } = await publicClient().from("policies").select(POL).eq("slug", slug).maybeSingle();
  return data ? { ...toPolicy(data as unknown as Row), year: (data as unknown as Row).year as number } : null;
}

export async function getPolicySlugs(): Promise<string[]> {
  if (!supabaseConfigured()) return seed.policies.map((p) => p.slug);
  const { data } = await publicClient().from("policies").select("slug");
  return (data ?? []).map((r) => r.slug);
}

// ───────────────────────── hero ─────────────────────────

/** Hero slides: approved photos ticked "is_hero" whose show window (hero_start..hero_end, Bangkok date) includes today,
 *  in staff-defined order (uploads and shipped banner files alike). Without Supabase (local dev) content/banner.json.
 *  None -> one gradient slide. Order 1 is kept free for banner 01 (to come); banner 02 slides are 2–4. */
export async function getHeroPhotos(): Promise<Photo[]> {
  if (!supabaseConfigured()) return banner.map((b) => staticSlide(b.id, `/banner/${b.file}`, b.w, b.h, b.blur, "", null, "school"));
  const today = new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);
  const { data } = await publicClient()
    .from("photos").select(`${IMG_COLS},caption,static_path,credit,alt_th,alt_en`).eq("is_hero", true)
    .or(`hero_start.is.null,hero_start.lte.${today}`).or(`hero_end.is.null,hero_end.gte.${today}`)
    .order("hero_order", { ascending: true });
  return (data ?? []).map((r) => {
    const credit = r.credit === "school" || r.credit === "council" ? r.credit : null;
    const alt = r.alt_th ? l(r.alt_th, r.alt_en) : null;
    if (r.static_path) return staticSlide(r.id, r.static_path, r.width, r.height, r.blur, r.caption, alt, credit);
    const img = toImg(r as PhotoRow) as Img;
    return { id: img.id, w: img.w, h: img.h, blur: img.blur, src: img.src[1920], srcSet: `${img.src[480]} 480w, ${img.src[960]} 960w, ${img.src[1920]} 1920w`, avifSet: null, caption: r.caption, alt, credit, plain: false };
  });
}

/** Files shipped in public/: /banner/<name>-{768,1280,1920}.webp (school photos) or /banners/<name>-{640,1280,1920}.{avif,webp}
 *  (council banners, shown as delivered). A file never wider than its source: the largest width is capped at w. */
function staticSlide(id: string, path: string, w: number, h: number, blur: string | null, caption: string, alt: L | null, credit: Photo["credit"]): Photo {
  const banner = path.startsWith("/banners/");
  const widths = banner ? [640, 1280, 1920] : [768, 1280, 1920];
  const set = (ext: string) => widths.map((x) => `${path}-${x}.${ext} ${Math.min(x, w)}w`).join(", ");
  return { id, w, h, blur, caption, alt, credit, src: `${path}-1920.webp`, srcSet: set("webp"), avifSet: banner ? set("avif") : null, plain: banner };
}
