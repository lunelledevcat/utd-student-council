import "server-only";
import seed from "@/content/seed.json";
import { supabaseConfigured } from "@/lib/env";
import { adminClient } from "@/lib/supabase/admin";
import { publicClient, publicImageUrl } from "@/lib/supabase/public";

// Public content, scoped to one academic year. With Supabase configured it comes from approved rows
// (RLS: anon sees status='approved' only, and never the instagram/contact columns); without it (local dev)
// content/seed.json is used so the site still renders. Everything here is public by design and small
// (one year of one school council), so a year is sent to the page in one piece and tabs/search run client-side.

export type Img = { id: string; w: number; h: number; blur: string | null; src: { 480: string; 960: string; 1920: string } };
export type Announcement = { id: string; title: string; date: string; body: string[]; link: string | null; pinned: boolean; cover: Img | null };
export type Activity = { id: string; title: string; date: string; body: string[]; photos: (Img | null)[] };
export type PolicyStatus = "planned" | "in-progress" | "done";
export type TimelineStep = { date: string; text: string };
export type Policy = {
  id: string; slug: string; title: string; summary: string; body: string[]; status: PolicyStatus; progress: number;
  owner: string; timeline: TimelineStep[]; cover: Img | null; photos: (Img | null)[];
};
export type Contact = { instagram: string | null; contact: string | null };
export type Member = {
  id: string; name: string; nickname: string; role: string; termNo: string; execTitle: string; dept: string; party: string;
  photo: Img | null; rank: number;
} & Contact;
export type Advisor = { id: string; name: string; nickname: string; role: string; subject: string; position: string; photo: Img | null } & Contact;
export type YearContent = {
  year: number; years: number[]; current: number;
  announcements: Announcement[]; activities: Activity[]; policies: Policy[]; members: Member[]; advisors: Advisor[];
};
/** @deprecated name kept for the hero slideshow */
export type Photo = Img & { caption: string };

const paragraphs = (s: string) => s.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
const one = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? v[0] ?? null : v ?? null);

type PhotoRow = { id: string; width: number; height: number; blur: string | null; sort_order?: number };
const IMG_COLS = "id,width,height,blur,sort_order";
const toImg = (r: PhotoRow | null): Img | null => {
  if (!r) return null;
  const p = (w: number) => publicImageUrl(`photos/${r.id}/${w}.webp`);
  return { id: r.id, w: r.width, h: r.height, blur: r.blur, src: { 480: p(480), 960: p(960), 1920: p(1920) } };
};
const sortedImgs = (rows: PhotoRow[] | null) => [...(rows ?? [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)).map(toImg);

/** Only consented contacts leave the server. `@handle` / URL / spaces are stripped to a bare IG handle. */
const contactOf = (consent: boolean, instagram: string | null | undefined, contact: string | null | undefined): Contact =>
  consent
    ? { instagram: instagram?.trim().replace(/^@/, "") || null, contact: contact?.trim() || null }
    : { instagram: null, contact: null };

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
  const content = supabaseConfigured() ? await fromDb(year, years) : fromSeed(year, years);
  return { ...content, current };
}

function fromSeed(year: number, years: number[]): Omit<YearContent, "current"> {
  const ofYear = <T extends { year: number }>(xs: T[]) => xs.filter((x) => x.year === year);
  const blanks = (n: number) => Array.from({ length: n }, () => null);
  return {
    year,
    years,
    announcements: ofYear(seed.announcements)
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.date.localeCompare(a.date))
      .map((a) => ({ id: a.id, title: a.title, date: a.date, body: paragraphs(a.body), link: a.link, pinned: a.pinned, cover: null })),
    activities: ofYear(seed.activities)
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((a) => ({ id: a.id, title: a.title, date: a.date, body: paragraphs(a.body), photos: blanks(a.photos) })),
    policies: ofYear(seed.policies).map((p) => ({
      id: p.id, slug: p.slug, title: p.title, summary: p.summary, body: paragraphs(p.body), status: p.status as PolicyStatus,
      progress: p.progress, owner: p.owner, timeline: p.timeline, cover: null, photos: blanks(p.photos),
    })),
    members: ofYear(seed.members).map((m, i) => ({
      id: m.id, name: m.name, nickname: m.nickname, role: m.role, termNo: m.termNo, execTitle: m.execTitle, dept: m.dept,
      party: m.party, photo: null, rank: i, ...contactOf(m.consent, m.instagram, m.contact),
    })),
    advisors: ofYear(seed.advisors).map((a) => ({
      id: a.id, name: a.name, nickname: a.nickname, role: a.role, subject: a.subject, position: a.position, photo: null,
      ...contactOf(a.consent, a.instagram, a.contact),
    })),
  };
}

async function fromDb(year: number, years: number[]): Promise<Omit<YearContent, "current">> {
  const db = publicClient();
  const [ann, act, pol, mem, adv] = await Promise.all([
    db.from("announcements").select(`id,title,body,published_on,link_url,pinned,cover:photos!cover_photo_id(${IMG_COLS})`)
      .eq("year", year).order("pinned", { ascending: false }).order("published_on", { ascending: false }),
    db.from("activities").select(`id,title,body,event_date,photos:photos!activity_id(${IMG_COLS})`)
      .eq("year", year).order("event_date", { ascending: false }),
    db.from("policies").select(`id,slug,title,summary,body,progress_status,progress,owner,timeline,cover:photos!cover_photo_id(${IMG_COLS}),photos:photos!policy_id(${IMG_COLS})`)
      .eq("year", year).order("sort_order"),
    db.from("members").select(`id,name,nickname,role_title,term_no,exec_title,dept,party,sort_order,consent_public,photo:photos!photo_id(${IMG_COLS})`)
      .eq("year", year).order("sort_order"),
    db.from("advisors").select(`id,name,nickname,role_label,subject_group,position,sort_order,consent_public,photo:photos!photo_id(${IMG_COLS})`)
      .eq("year", year).order("sort_order"),
  ]);
  for (const r of [ann, act, pol, mem, adv]) if (r.error) console.error("[content]", r.error.message);

  const contacts = await consentedContacts(year);
  return {
    year,
    years,
    announcements: (ann.data ?? []).map((r) => ({
      id: r.id, title: r.title, date: r.published_on, body: paragraphs(r.body), link: r.link_url, pinned: r.pinned, cover: toImg(one(r.cover)),
    })),
    activities: (act.data ?? []).map((r) => ({ id: r.id, title: r.title, date: r.event_date, body: paragraphs(r.body), photos: sortedImgs(r.photos) })),
    policies: (pol.data ?? []).map(toPolicy),
    members: (mem.data ?? []).map((r) => ({
      id: r.id, name: r.name, nickname: r.nickname, role: r.role_title, termNo: r.term_no, execTitle: r.exec_title, dept: r.dept,
      party: r.party, photo: toImg(one(r.photo)), rank: r.sort_order, ...(contacts.get(r.id) ?? contactOf(false, null, null)),
    })),
    advisors: (adv.data ?? []).map((r) => ({
      id: r.id, name: r.name, nickname: r.nickname, role: r.role_label, subject: r.subject_group, position: r.position,
      photo: toImg(one(r.photo)), ...(contacts.get(r.id) ?? contactOf(false, null, null)),
    })),
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

type PolicyRow = {
  id: string; slug: string; title: string; summary: string; body: string; progress_status: PolicyStatus; progress: number; owner: string;
  timeline: unknown; cover: PhotoRow | PhotoRow[] | null; photos: PhotoRow[] | null;
};
function toPolicy(r: PolicyRow): Policy {
  const timeline = Array.isArray(r.timeline)
    ? r.timeline.filter((s): s is TimelineStep => typeof s?.date === "string" && typeof s?.text === "string")
    : [];
  return {
    id: r.id, slug: r.slug, title: r.title, summary: r.summary, body: paragraphs(r.body), status: r.progress_status, progress: r.progress,
    owner: r.owner, timeline, cover: toImg(one(r.cover)), photos: sortedImgs(r.photos),
  };
}

// ───────────────────────── policy page ─────────────────────────

export async function getPolicyBySlug(slug: string): Promise<(Policy & { year: number }) | null> {
  if (!supabaseConfigured()) {
    const p = seed.policies.find((x) => x.slug === slug);
    if (!p) return null;
    const c = fromSeed(p.year, seed.years);
    const pol = c.policies.find((x) => x.slug === slug);
    return pol ? { ...pol, year: p.year } : null;
  }
  const { data } = await publicClient()
    .from("policies")
    .select(`id,year,slug,title,summary,body,progress_status,progress,owner,timeline,cover:photos!cover_photo_id(${IMG_COLS}),photos:photos!policy_id(${IMG_COLS})`)
    .eq("slug", slug)
    .maybeSingle();
  return data ? { ...toPolicy(data as PolicyRow), year: data.year } : null;
}

export async function getPolicySlugs(): Promise<string[]> {
  if (!supabaseConfigured()) return seed.policies.map((p) => p.slug);
  const { data } = await publicClient().from("policies").select("slug");
  return (data ?? []).map((r) => r.slug);
}

// ───────────────────────── hero ─────────────────────────

/** Hero slides: approved + ticked "is_hero", in admin-defined order. Empty -> gradient fallback. */
export async function getHeroPhotos(): Promise<Photo[]> {
  if (!supabaseConfigured()) return [];
  const { data } = await publicClient().from("photos").select(`${IMG_COLS},caption`).eq("is_hero", true).order("hero_order", { ascending: true });
  return (data ?? []).map((r) => ({ ...(toImg(r as PhotoRow) as Img), caption: r.caption }));
}
