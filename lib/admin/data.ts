import "server-only";
import { ENTITIES, type EntityKey, type ReviewStatus } from "@/lib/admin/entities";
import { previewUrls } from "@/lib/admin/photos";
import { getYears } from "@/lib/content";
import { createClient } from "@/lib/supabase/server";
import { publicImageUrl } from "@/lib/supabase/public";

// Back-office reads go through the signed-in user's session client, so RLS decides what each role sees
// (council: approved rows + their own; staff: everything). Callers have already passed requireRole().

export type ListRow = {
  id: string; title: string; titleEn: string | null; sub: string; status: ReviewStatus; reason: string | null; mine: boolean;
};

export async function yearParam(raw: string | undefined) {
  const { years, current } = await getYears();
  const y = Number(raw);
  return { years, current, year: years.includes(y) ? y : current };
}

export async function listRows(key: EntityKey, year: number, userId: string): Promise<ListRow[]> {
  const e = ENTITIES[key];
  const hasEn = e.fields.some((f) => f.name === e.titleCol && "en" in f && f.en);
  const cols = ["id", e.titleCol, hasEn && `${e.titleCol}_en`, e.subCol, "status", "reason", "author_id"].filter(Boolean).join(",");
  const { data, error } = await (await createClient()).from(key).select(cols).eq("year", year).order(e.order.col, { ascending: e.order.asc });
  if (error) console.error("[dashboard] list", key, error.message);
  return ((data ?? []) as unknown as Record<string, unknown>[]).map((r) => ({
    id: r.id as string,
    title: String(r[e.titleCol] ?? ""),
    titleEn: hasEn ? String(r[`${e.titleCol}_en`] ?? "") || null : null,
    sub: e.subCol ? String(r[e.subCol] ?? "") : "",
    status: r.status as ReviewStatus,
    reason: (r.reason as string | null) ?? null,
    mine: r.author_id === userId,
  }));
}

/** Total and pending rows per entity for the overview. */
export async function counts(year: number) {
  const db = await createClient();
  const out = {} as Record<EntityKey, { total: number; pending: number }>;
  await Promise.all(
    (Object.keys(ENTITIES) as EntityKey[]).map(async (k) => {
      const { data } = await db.from(k).select("status").eq("year", year);
      const rows = (data ?? []) as { status: string }[];
      out[k] = { total: rows.length, pending: rows.filter((r) => r.status === "pending").length };
    }),
  );
  return out;
}

export type FormPhoto = { id: string; url: string; pending: boolean };

/** A row for the edit form plus preview URLs of its photos (single image columns and linked galleries). */
export async function getRowForForm(key: EntityKey, id: string) {
  const e = ENTITIES[key];
  const db = await createClient();
  const { data: row } = await db.from(key).select("*").eq("id", id).maybeSingle();
  if (!row) return null;
  const r = row as Record<string, unknown>;
  const single = e.fields.filter((f) => f.kind === "image").map((f) => r[f.name] as string | null).filter((x): x is string => !!x);
  const galleries: Record<string, string[]> = {};
  const ids = [...single];
  for (const f of e.fields) {
    if (f.kind !== "images") continue;
    const { data } = await db.from("photos").select("id").eq(f.fk, id).order("sort_order");
    galleries[f.name] = (data ?? []).map((p) => p.id as string);
    ids.push(...galleries[f.name]);
  }
  const { data: photos } = ids.length ? await db.from("photos").select("id,status").in("id", ids) : { data: [] };
  const status = new Map((photos ?? []).map((p) => [p.id as string, p.status as string]));
  const urls = await previewUrls([...status].map(([pid, st]) => ({ id: pid, status: st })));
  const photo = (pid: string): FormPhoto | null => (urls[pid] ? { id: pid, url: urls[pid], pending: status.get(pid) !== "approved" } : null);
  const media: Record<string, FormPhoto[]> = {};
  for (const f of e.fields) {
    if (f.kind === "image") media[f.name] = [r[f.name] as string | null].filter((x): x is string => !!x).map(photo).filter((x): x is FormPhoto => !!x);
    if (f.kind === "images") media[f.name] = galleries[f.name].map(photo).filter((x): x is FormPhoto => !!x);
  }
  return { row: r, media };
}

export async function approvedPhotos() {
  const { data } = await (await createClient())
    .from("photos").select("id,caption,is_hero,hero_order,created_at").eq("status", "approved").order("is_hero", { ascending: false }).order("hero_order").order("created_at", { ascending: false }).limit(200);
  return (data ?? []).map((p) => ({ id: p.id as string, caption: p.caption as string, isHero: !!p.is_hero, order: p.hero_order as number, url: publicImageUrl(`photos/${p.id}/480.webp`) }));
}
