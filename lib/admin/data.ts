import "server-only";
import { ENTITIES, type EntityKey } from "@/lib/admin/entities";
import { getYears } from "@/lib/content";
import * as ent from "@/lib/data/entities";
import * as ph from "@/lib/data/photos";
import type { Actor } from "@/lib/data/rules";
import { getDb } from "@/lib/db";
import { previewUrl, publicPhotoUrl } from "@/lib/media";

// Back-office reads for pages. The caller (actor, from requireRole) is passed to lib/data/*, which decides what each
// role sees (council: approved rows + their own; staff: everything).

export type { ListRow } from "@/lib/data/entities";
export { PAGE_SIZE } from "@/lib/data/entities";

export async function yearParam(raw: string | undefined) {
  const { years, current } = await getYears();
  const y = Number(raw);
  return { years, current, year: years.includes(y) ? y : current };
}

/** One page of a back-office list, optionally filtered by a search over the Thai/English title. */
export const listRows = (a: Actor, key: EntityKey, year: number, opts: { page?: number; q?: string } = {}) => ent.listRows(getDb(), a, key, year, opts);

/** Total and pending rows per entity for the overview. */
export const counts = (a: Actor, year: number) => ent.counts(getDb(), a, year);

export type FormPhoto = { id: string; url: string; pending: boolean };

/** A row for the edit form plus preview URLs of its photos (single image columns and linked galleries). */
export async function getRowForForm(a: Actor, key: EntityKey, id: string) {
  const db = getDb();
  const r = await ent.getRow(db, a, key, id);
  if (!r) return null;
  const e = ENTITIES[key];
  const { galleries, all } = await ent.rowPhotoIds(db, key, id, r);
  const rows = new Map((await ph.photosByIds(db, all)).map((p) => [p.id, p]));
  const photo = (pid: string): FormPhoto | null => {
    const p = rows.get(pid);
    if (!p) return null;
    if (p.static_path) return { id: pid, url: `${p.static_path}-768.webp`, pending: false };
    if (p.status === "approved") return { id: pid, url: publicPhotoUrl(pid, 480), pending: false };
    return p.uploaded_by ? { id: pid, url: previewUrl(p.uploaded_by, pid), pending: true } : null;
  };
  const media: Record<string, FormPhoto[]> = {};
  for (const f of e.fields) {
    if (f.kind === "image") media[f.name] = [r[f.name] as string | null].filter((x): x is string => !!x).map(photo).filter((x): x is FormPhoto => !!x);
    if (f.kind === "images") media[f.name] = (galleries[f.name] ?? []).map(photo).filter((x): x is FormPhoto => !!x);
  }
  return { row: r, media };
}

export async function approvedPhotos(a: Actor) {
  return (await ph.approvedPhotos(getDb(), a)).map((p) => ({
    id: p.id, caption: p.caption, isHero: !!p.is_hero, order: p.hero_order, school: p.credit === "school",
    url: p.static_path ? `${p.static_path}-768.webp` : publicPhotoUrl(p.id, 480),
  }));
}
