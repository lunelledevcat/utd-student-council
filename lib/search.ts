import type { Advisor, Member, YearContent } from "@/lib/content";

export type TabKey = "news" | "policy" | "council" | "advisor";
export const TAB_KEYS: TabKey[] = ["news", "policy", "council", "advisor"];
export const DEFAULT_TAB: TabKey = "news";
export const isTab = (v: unknown): v is TabKey => typeof v === "string" && (TAB_KEYS as string[]).includes(v);

/** Shareable URL for a tab/year; defaults are left out so "/" stays "/". */
export function homeHref(tab: TabKey, year: number | null, currentYear: number) {
  const q = new URLSearchParams();
  if (tab !== DEFAULT_TAB) q.set("tab", tab);
  if (year && year !== currentYear) q.set("year", String(year));
  const s = q.toString();
  return s ? `/?${s}` : "/";
}

const norm = (s: string) => s.normalize("NFC").toLowerCase().replace(/\s+/g, " ").trim();
const hit = (q: string, ...fields: (string | string[] | null | undefined)[]) =>
  fields.some((f) => !!f && norm(Array.isArray(f) ? f.join(" ") : f).includes(q));

/** Filters every tab at once (news title/body, policy, people name/nickname/positions/dept/party). */
export function filterContent(c: YearContent, query: string) {
  const q = norm(query);
  if (!q) return { ...c, q };
  return {
    ...c,
    q,
    announcements: c.announcements.filter((a) => hit(q, a.title, a.body)),
    activities: c.activities.filter((a) => hit(q, a.title, a.body)),
    policies: c.policies.filter((p) => hit(q, p.title, p.summary, p.owner, p.body)),
    members: c.members.filter((m: Member) => hit(q, m.name, m.nickname, m.role, m.execTitle, m.dept, m.party, m.termNo)),
    advisors: c.advisors.filter((a: Advisor) => hit(q, a.name, a.nickname, a.role, a.subject, a.position)),
  };
}

export const tabCount = (c: Pick<YearContent, "announcements" | "activities" | "policies" | "members" | "advisors">, t: TabKey) =>
  t === "news" ? c.announcements.length + c.activities.length : t === "policy" ? c.policies.length : t === "council" ? c.members.length : c.advisors.length;

/** Badge for a council position (reference: crown = president, medal = vice). */
export function rankOf(role: string): "president" | "vice" | null {
  if (role.includes("รองประธาน")) return "vice";
  if (role.includes("ประธาน")) return "president";
  return null;
}
