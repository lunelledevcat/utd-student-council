import "server-only";
import * as data from "@/lib/data/content";
import type { PhotoRow } from "@/lib/data/content";
import { getDb } from "@/lib/db";
import { publicPhotoUrl } from "@/lib/media";

// Public content, scoped to one academic year: approved rows and approved photos only (lib/data/content.ts), contacts
// only with consent (contactOf below).
// Everything here is public by design and small (one year of one school council), so a year is sent to the page
// in one piece, in both languages, and tabs / search / language switching run client-side.

/** Text in Thai (always) and English (optional — null = not translated, the UI falls back to Thai with a "TH" label). */
export type L<T = string> = { th: T; en: T | null };
export type Img = { id: string; w: number; h: number; blur: string | null; src: { 480: string; 960: string; 1920: string } };
export type Announcement = { id: string; title: L; date: string; body: L<string[]>; link: string | null; pinned: boolean; cover: Img | null };
export type Activity = { id: string; title: L; date: string; body: L<string[]>; photos: Img[] };
export type PolicyStatus = "planned" | "in-progress" | "done";
export type TimelineStep = { date: string; text: L };
export type Policy = {
  id: string; slug: string; title: L; summary: L; body: L<string[]>; status: PolicyStatus; progress: number;
  owner: L; timeline: TimelineStep[]; cover: Img | null; photos: Img[];
};
export type Contact = { instagram: string | null; contact: string | null };
export type Member = {
  id: string; name: L; nickname: L; role: L; termNo: string; execTitle: L; dept: L; party: L; photo: Img | null; rank: number;
} & Contact;
export type Advisor = { id: string; name: L; nickname: L; role: L; subject: L; position: L; photo: Img | null } & Contact;
export type YearContent = {
  year: number; years: number[]; current: number;
  announcements: Announcement[]; activities: Activity[]; policies: Policy[]; members: Member[]; advisors: Advisor[];
};
/** Hero slide: either an uploaded photo (storage variants) or a banner file shipped in public/banner. */
export type Photo = { id: string; w: number; h: number; blur: string | null; src: string; srcSet: string; caption: string; credit: "school" | null };

const paragraphs = (s: string | null | undefined) => (s ?? "").split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
const l = (th: string | null | undefined, en: string | null | undefined): L => ({ th: th ?? "", en: en?.trim() ? en.trim() : null });
const lp = (th: string | null | undefined, en: string | null | undefined): L<string[]> => {
  const e = paragraphs(en);
  return { th: paragraphs(th), en: e.length ? e : null };
};

const toImg = (r: Pick<PhotoRow, "id" | "width" | "height" | "blur"> | null | undefined): Img | null => {
  if (!r) return null;
  const p = (w: 480 | 960 | 1920) => publicPhotoUrl(r.id, w);
  return { id: r.id, w: r.width, h: r.height, blur: r.blur, src: { 480: p(480), 960: p(960), 1920: p(1920) } };
};
const sortedImgs = (rows: PhotoRow[]) =>
  [...rows].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)).map(toImg).filter((x): x is Img => !!x);

/** Only consented contacts leave the server. `@handle` is stripped to a bare IG handle. */
const contactOf = (consent: boolean, instagram: string | null | undefined, contact: string | null | undefined): Contact =>
  consent
    ? { instagram: instagram?.trim().replace(/^@/, "") || null, contact: contact?.trim() || null }
    : { instagram: null, contact: null };

// ───────────────────────── row -> view model (shared by seed and DB) ─────────────────────────

type Row = Record<string, unknown> & { id: string };
const s = (r: Row, k: string) => (r[k] as string | null | undefined) ?? "";

type Pics = { byId: Map<string, PhotoRow>; activity: Map<string, PhotoRow[]>; policy: Map<string, PhotoRow[]> };
function pics(imgs: PhotoRow[]): Pics {
  const group = (k: "activity_id" | "policy_id") => imgs.reduce((m, p) => (p[k] ? m.set(p[k]!, [...(m.get(p[k]!) ?? []), p]) : m), new Map<string, PhotoRow[]>());
  return { byId: new Map(imgs.map((p) => [p.id, p])), activity: group("activity_id"), policy: group("policy_id") };
}
const pic = (P: Pics, id: unknown) => toImg(typeof id === "string" ? P.byId.get(id) : null);

const toAnnouncement = (r: Row, P: Pics): Announcement => ({
  id: r.id, title: l(s(r, "title"), s(r, "title_en")), date: s(r, "published_on"), body: lp(s(r, "body"), s(r, "body_en")),
  link: (r.link_url as string | null) ?? null, pinned: !!r.pinned, cover: pic(P, r.cover_photo_id),
});
const toActivity = (r: Row, P: Pics): Activity => ({
  id: r.id, title: l(s(r, "title"), s(r, "title_en")), date: s(r, "event_date"), body: lp(s(r, "body"), s(r, "body_en")),
  photos: sortedImgs(P.activity.get(r.id) ?? []),
});
const toPolicy = (r: Row, P: Pics): Policy => ({
  id: r.id, slug: s(r, "slug"), title: l(s(r, "title"), s(r, "title_en")), summary: l(s(r, "summary"), s(r, "summary_en")),
  body: lp(s(r, "body"), s(r, "body_en")), status: s(r, "progress_status") as PolicyStatus, progress: Number(r.progress ?? 0),
  owner: l(s(r, "owner"), s(r, "owner_en")),
  timeline: (Array.isArray(r.timeline) ? r.timeline : [])
    .filter((t): t is { date: string; text: string; text_en?: string } => typeof t?.date === "string" && typeof t?.text === "string")
    .map((t) => ({ date: t.date, text: l(t.text, t.text_en) })),
  cover: pic(P, r.cover_photo_id), photos: sortedImgs(P.policy.get(r.id) ?? []),
});
const toMember = (r: Row, P: Pics): Member => ({
  id: r.id, name: l(s(r, "name"), s(r, "name_en")), nickname: l(s(r, "nickname"), s(r, "nickname_en")),
  role: l(s(r, "role_title"), s(r, "role_title_en")), termNo: s(r, "term_no"), execTitle: l(s(r, "exec_title"), s(r, "exec_title_en")),
  dept: l(s(r, "dept"), s(r, "dept_en")), party: l(s(r, "party"), s(r, "party_en")), photo: pic(P, r.photo_id),
  rank: Number(r.sort_order ?? 0), ...contactOf(!!r.consent_public, r.instagram as string, r.contact as string),
});
const toAdvisor = (r: Row, P: Pics): Advisor => ({
  id: r.id, name: l(s(r, "name"), s(r, "name_en")), nickname: l(s(r, "nickname"), s(r, "nickname_en")),
  role: l(s(r, "role_label"), s(r, "role_label_en")), subject: l(s(r, "subject_group"), s(r, "subject_group_en")),
  position: l(s(r, "position"), s(r, "position_en")), photo: pic(P, r.photo_id),
  ...contactOf(!!r.consent_public, r.instagram as string, r.contact as string),
});

// ───────────────────────── years ─────────────────────────

export async function getYears(): Promise<{ years: number[]; current: number }> {
  const rows = await data.years(getDb());
  const years = rows.map((r) => r.year);
  const current = rows.find((r) => r.is_current)?.year ?? years[0] ?? new Date().getFullYear() + 543;
  return { years: years.length ? years : [current], current };
}

// ───────────────────────── one year ─────────────────────────

export async function getYearContent(requested?: number): Promise<YearContent> {
  const { years, current } = await getYears();
  const year = requested && years.includes(requested) ? requested : current;
  const d = await data.yearRows(getDb(), year);
  const P = pics(d.imgs);
  const rows = (xs: unknown[]) => xs as Row[];
  return {
    year, years, current,
    announcements: rows(d.ann).map((r) => toAnnouncement(r, P)),
    activities: rows(d.act).map((r) => toActivity(r, P)),
    policies: rows(d.pol).map((r) => toPolicy(r, P)),
    members: rows(d.mem).map((r) => toMember(r, P)),
    advisors: rows(d.adv).map((r) => toAdvisor(r, P)),
  };
}

// ───────────────────────── policy page ─────────────────────────

export async function getPolicyBySlug(slug: string): Promise<(Policy & { year: number }) | null> {
  const d = await data.policyBySlug(getDb(), slug);
  return d ? { ...toPolicy(d.p as unknown as Row, pics(d.imgs)), year: d.p.year } : null;
}

export const getPolicySlugs = () => data.policySlugs(getDb());

// ───────────────────────── hero ─────────────────────────

/** Hero slides: approved photos ticked "is_hero", in staff-defined order (uploads and public/banner files alike).
 *  None -> one gradient slide. */
export async function getHeroPhotos(): Promise<Photo[]> {
  return (await data.heroPhotos(getDb())).map((r) => {
    const credit = r.credit === "school" ? "school" : null;
    if (r.static_path) return staticSlide(r.id, r.static_path, r.width, r.height, r.blur, r.caption, credit);
    const img = toImg(r) as Img;
    return { id: img.id, w: img.w, h: img.h, blur: img.blur, src: img.src[1920], srcSet: `${img.src[480]} 480w, ${img.src[960]} 960w, ${img.src[1920]} 1920w`, caption: r.caption, credit };
  });
}

const staticSlide = (id: string, path: string, w: number, h: number, blur: string | null, caption: string, credit: "school" | null): Photo => ({
  id, w, h, blur, caption, credit, src: `${path}-1920.webp`, srcSet: `${path}-768.webp 768w, ${path}-1280.webp 1280w, ${path}-1920.webp 1920w`,
});
