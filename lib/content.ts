import "server-only";
import news from "@/content/news.json";
import events from "@/content/events.json";
import policies from "@/content/policies.json";
import members from "@/content/members.json";

// Content lives server-side only (RSC). Client components receive just the slice they render;
// public APIs paginate (see lib/pagination.ts).

export type NewsItem = (typeof news)[number];
export type EventItem = (typeof events)[number];
export type PolicyItem = Omit<(typeof policies)[number], "status"> & { status: PolicyStatus };
export type Member = (typeof members)[number];
export type PolicyStatus = "done" | "in-progress" | "planned";

export const STATUS_LABEL: Record<PolicyStatus, string> = {
  done: "สำเร็จ",
  "in-progress": "กำลังทำ",
  planned: "วางแผน",
};

export const getNews = () => [...news].sort((a, b) => b.date.localeCompare(a.date));
export const getNewsBySlug = (slug: string) => news.find((n) => n.slug === slug);
export const getEvents = () => [...events].sort((a, b) => a.date.localeCompare(b.date));
export const getEventBySlug = (slug: string) => events.find((e) => e.slug === slug);
export const getPolicies = () => policies as PolicyItem[];
export const getMembers = () => members;

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
