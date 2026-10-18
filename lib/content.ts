import "server-only";
import news from "@/content/news.json";
import events from "@/content/events.json";
import policies from "@/content/policies.json";
import members from "@/content/members.json";
import { supabaseConfigured } from "@/lib/env";
import { publicClient, publicImageUrl } from "@/lib/supabase/public";

// Public content. With Supabase configured it comes from approved rows (RLS: anon sees status='approved' only);
// without it (local dev) the JSON seeds in content/ are used so the site still renders.
// Client components only receive the slice they render; public APIs paginate (lib/pagination.ts).

export type NewsItem = { slug: string; title: string; tag: string; date: string; excerpt: string; body: string[] };
export type EventItem = { slug: string; title: string; date: string; time: string; place: string; summary: string; body: string[] };
export type Member = { id: string; name: string; role: string; dept: string; grade: string };
export type PolicyStatus = "done" | "in-progress" | "planned";
export type PolicyItem = Omit<(typeof policies)[number], "status"> & { status: PolicyStatus };
export type Photo = { id: string; caption: string; album: string | null; w: number; h: number; src: { 480: string; 960: string; 1920: string } };

export const STATUS_LABEL: Record<PolicyStatus, string> = {
  done: "สำเร็จ",
  "in-progress": "กำลังทำ",
  planned: "วางแผน",
};

const paragraphs = (s: string) => s.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

export async function getNews(): Promise<NewsItem[]> {
  if (!supabaseConfigured()) return [...news].sort((a, b) => b.date.localeCompare(a.date));
  const { data } = await publicClient().from("news").select("slug,title,tag,excerpt,body,published_on").order("published_on", { ascending: false });
  return (data ?? []).map((r) => ({ slug: r.slug, title: r.title, tag: r.tag, date: r.published_on, excerpt: r.excerpt, body: paragraphs(r.body) }));
}
export async function getNewsBySlug(slug: string) {
  return (await getNews()).find((n) => n.slug === slug);
}

export async function getEvents(): Promise<EventItem[]> {
  if (!supabaseConfigured()) return [...events].sort((a, b) => a.date.localeCompare(b.date));
  const { data } = await publicClient().from("events").select("slug,title,event_date,event_time,place,summary,body").order("event_date", { ascending: true });
  return (data ?? []).map((r) => ({ slug: r.slug, title: r.title, date: r.event_date, time: r.event_time, place: r.place, summary: r.summary, body: paragraphs(r.body) }));
}
export async function getEventBySlug(slug: string) {
  return (await getEvents()).find((e) => e.slug === slug);
}

export const getPolicies = () => policies as PolicyItem[];

export async function getMembers(): Promise<Member[]> {
  if (!supabaseConfigured()) return members;
  const { data } = await publicClient().from("members").select("id,name,role_title,dept,grade").order("sort_order", { ascending: true });
  return (data ?? []).map((r) => ({ id: r.id, name: r.name, role: r.role_title, dept: r.dept, grade: r.grade }));
}

// ── photos (only approved rows are visible to the anon client) ──
type PhotoRow = { id: string; caption: string; width: number; height: number; albums: { title: string } | { title: string }[] | null };
const toPhoto = (r: PhotoRow): Photo => {
  const album = Array.isArray(r.albums) ? r.albums[0] : r.albums;
  const p = (w: number) => publicImageUrl(`photos/${r.id}/${w}.webp`);
  return { id: r.id, caption: r.caption, album: album?.title ?? null, w: r.width, h: r.height, src: { 480: p(480), 960: p(960), 1920: p(1920) } };
};
const PHOTO_COLS = "id,caption,width,height,albums(title)";

/** Hero slides: approved + ticked "is_hero", in admin-defined order. Empty -> Hero falls back to the gradient + mandapa. */
export async function getHeroPhotos(): Promise<Photo[]> {
  if (!supabaseConfigured()) return [];
  const { data } = await publicClient().from("photos").select(PHOTO_COLS).eq("is_hero", true).order("hero_order", { ascending: true });
  return (data ?? []).map((r) => toPhoto(r as PhotoRow));
}

export async function getLatestPhotos(limit: number): Promise<Photo[]> {
  if (!supabaseConfigured()) return [];
  const { data } = await publicClient().from("photos").select(PHOTO_COLS).order("created_at", { ascending: false }).limit(limit);
  return (data ?? []).map((r) => toPhoto(r as PhotoRow));
}

export type Album = { slug: string; title: string; description: string | null; photos: Photo[] };
export async function getAlbums(): Promise<Album[]> {
  if (!supabaseConfigured()) return [];
  const db = publicClient();
  const [{ data: albums }, { data: photos }] = await Promise.all([
    db.from("albums").select("id,slug,title,description").order("created_at", { ascending: true }),
    db.from("photos").select(`${PHOTO_COLS},album_id`).order("created_at", { ascending: false }),
  ]);
  return (albums ?? [])
    .map((a) => ({
      slug: a.slug,
      title: a.title,
      description: a.description,
      photos: (photos ?? []).filter((p) => p.album_id === a.id).map((p) => toPhoto(p as unknown as PhotoRow)),
    }))
    .filter((a) => a.photos.length > 0);
}

export const DOCUMENTS = [
  { id: "d1", title: "[รายงานการประชุมสภาครั้งที่ 1]", date: "2026-09-01", type: "PDF", href: "#" },
  { id: "d2", title: "[ประกาศสภานักเรียน เรื่อง ...]", date: "2026-09-15", type: "PDF", href: "#" },
  { id: "d3", title: "[รายงานผลการดำเนินงานไตรมาส 1]", date: "2026-10-01", type: "PDF", href: "#" },
] as const;

/** Whole days from today (Asia/Bangkok) until `iso`; never negative. */
export function daysUntil(iso: string) {
  const bkkNow = new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);
  const diff = (Date.parse(iso) - Date.parse(bkkNow)) / 86_400_000;
  return Math.max(0, Math.round(diff));
}
