// Back-office reads and writes of the five content tables. Every function takes the caller (Actor) and applies
// lib/data/rules.ts — this replaces RLS. Callers: app/[locale]/dashboard/* (after authorize()).
import { and, asc, desc, eq, inArray, like, notInArray, or, sql, type SQL } from "drizzle-orm";
import { ENTITIES, rowColumns, type EntityKey } from "@/lib/admin/entities";
import { CONTENT_TABLES, photos, type ReviewStatus } from "@/lib/db/schema";
import type { Db } from "@/lib/db/types";
import { DataError, canAttachPhoto, canCreate, canDelete, canEdit, canRead, canReview, isStaff, writable, type Actor } from "@/lib/data/rules";

const nowIso = () => new Date().toISOString();
type AnyTable = (typeof CONTENT_TABLES)[EntityKey];
// the five tables share id/year/status/author_id; drizzle's union typing is too narrow for generic code
const T = (key: EntityKey) => CONTENT_TABLES[key] as unknown as AnyTable & Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

/** What the caller may see in a list: staff everything, members approved + own. */
function visible(a: Actor, key: EntityKey): SQL | undefined {
  const t = T(key);
  if (isStaff(a)) return undefined;
  return a ? or(eq(t.status, "approved"), eq(t.author_id, a.id)) : eq(t.status, "approved");
}

export type ListRow = { id: string; title: string; titleEn: string | null; sub: string; status: ReviewStatus; reason: string | null; mine: boolean };
export const PAGE_SIZE = 20;

export async function listRows(db: Db, a: Actor, key: EntityKey, year: number, opts: { page?: number; q?: string } = {}) {
  const e = ENTITIES[key];
  const t = T(key);
  const hasEn = e.fields.some((f) => f.name === e.titleCol && "en" in f && f.en);
  const term = (opts.q ?? "").trim().slice(0, 80).replace(/[%_]/g, " ");
  const where = and(
    eq(t.year, year),
    visible(a, key),
    term ? or(like(t[e.titleCol], `%${term}%`), hasEn ? like(t[`${e.titleCol}_en`], `%${term}%`) : undefined) : undefined,
  );
  const page = Math.max(1, Math.floor(opts.page ?? 1));
  const [{ n }] = await db.select({ n: sql<number>`count(*)` }).from(t).where(where);
  const data = (await db.select().from(t).where(where)
    .orderBy(e.order.asc ? asc(t[e.order.col]) : desc(t[e.order.col]), asc(t.id))
    .limit(PAGE_SIZE).offset((page - 1) * PAGE_SIZE)) as Record<string, unknown>[];
  const rows: ListRow[] = data.map((r) => ({
    id: r.id as string,
    title: String(r[e.titleCol] ?? ""),
    titleEn: hasEn ? String(r[`${e.titleCol}_en`] ?? "") || null : null,
    sub: e.subCol ? String(r[e.subCol] ?? "") : "",
    status: r.status as ReviewStatus,
    reason: (r.reason as string | null) ?? null,
    mine: !!a && r.author_id === a.id,
  }));
  return { rows, total: n, page, pages: Math.max(1, Math.ceil(n / PAGE_SIZE)) };
}

export async function counts(db: Db, a: Actor, year: number) {
  const out = {} as Record<EntityKey, { total: number; pending: number }>;
  await Promise.all((Object.keys(ENTITIES) as EntityKey[]).map(async (k) => {
    const t = T(k);
    const [r] = await db.select({ total: sql<number>`count(*)`, pending: sql<number>`coalesce(sum(${t.status} = 'pending'), 0)` }).from(t).where(and(eq(t.year, year), visible(a, k)));
    out[k] = { total: r.total, pending: r.pending };
  }));
  return out;
}

async function rawRow(db: Db, key: EntityKey, id: string) {
  const t = T(key);
  const [r] = await db.select().from(t).where(eq(t.id, id)).limit(1);
  return (r as Record<string, unknown> | undefined) ?? null;
}
const owned = (r: Record<string, unknown>) => ({ status: r.status as ReviewStatus, owner: (r.author_id as string | null) ?? null });

/** A row the caller may open, or null (same answer for "missing" and "not yours": no existence leak). */
export async function getRow(db: Db, a: Actor, key: EntityKey, id: string) {
  const r = await rawRow(db, key, id);
  return r && canRead(a, owned(r)) ? r : null;
}

/** Ids of the photos referenced by a row (single image columns + gallery rows). */
export async function rowPhotoIds(db: Db, key: EntityKey, id: string, row?: Record<string, unknown> | null) {
  const e = ENTITIES[key];
  const r = row ?? (await rawRow(db, key, id));
  const single = e.fields.filter((f) => f.kind === "image").map((f) => r?.[f.name] as string | null).filter((x): x is string => !!x);
  const galleries: Record<string, string[]> = {};
  for (const f of e.fields) {
    if (f.kind !== "images") continue;
    const ps = await db.select({ id: photos.id }).from(photos).where(eq(photos[f.fk], id)).orderBy(asc(photos.sort_order));
    galleries[f.name] = ps.map((p) => p.id);
  }
  return { single, galleries, all: [...single, ...Object.values(galleries).flat()] };
}

/** Throws photoNotAllowed unless every id is attachable by the caller (rules.canAttachPhoto). */
async function checkPhotos(db: Db, a: Actor, key: EntityKey, rowId: string | null, ids: string[]) {
  const unique = [...new Set(ids)];
  if (!unique.length) return;
  const found = await db.select({ id: photos.id, uploaded_by: photos.uploaded_by }).from(photos).where(inArray(photos.id, unique));
  const onRow = rowId ? new Set((await rowPhotoIds(db, key, rowId)).all) : new Set<string>();
  const ok = found.filter((p) => canAttachPhoto(a, { uploaded_by: p.uploaded_by, onThisRow: onRow.has(p.id) }));
  if (ok.length !== unique.length) throw new DataError("photoNotAllowed");
}

/**
 * Create (id null) or update a row with validated values (lib/admin/validate.ts) and its gallery photo ids.
 * Council: create as self + pending; update only own pending/rejected rows, which go back to pending.
 */
export async function saveRow(db: Db, a: Actor, key: EntityKey, id: string | null, year: number, values: Record<string, unknown>, images: Record<string, string[]>) {
  const e = ENTITIES[key];
  const t = T(key);
  const cols = writable(a, Object.fromEntries(rowColumns(e).map((c) => [c, values[c]])));
  const imageIds = [...e.fields.filter((f) => f.kind === "image").map((f) => values[f.name] as string | null).filter((x): x is string => !!x), ...Object.values(images).flat()];

  let rowId = id;
  try {
    if (id) {
      const r = await rawRow(db, key, id);
      if (!r || !canEdit(a, owned(r))) throw new DataError("editLocked");
      await checkPhotos(db, a, key, id, imageIds);
      await db.update(t).set({ ...cols, updated_at: nowIso() }).where(eq(t.id, id));
    } else {
      if (!canCreate(a)) throw new DataError("forbidden");
      await checkPhotos(db, a, key, null, imageIds);
      rowId = crypto.randomUUID();
      await db.insert(t).values({ ...cols, id: rowId, year, author_id: a!.id, status: "pending" } as never);
    }
  } catch (err) {
    if (err instanceof DataError) throw err;
    const msg = `${(err as Error)?.message} ${String((err as { cause?: unknown })?.cause ?? "")}`;
    if (msg.includes("UNIQUE constraint failed")) throw new DataError("slugTaken");
    throw err;
  }

  // gallery links: detach what was removed, attach + order what was sent
  const stmts = e.fields.flatMap((f) => {
    if (f.kind !== "images") return [];
    const ids = images[f.name] ?? [];
    const col = photos[f.fk];
    return [
      db.update(photos).set({ [f.fk]: null }).where(ids.length ? and(eq(col, rowId!), notInArray(photos.id, ids)) : eq(col, rowId!)),
      ...ids.map((pid, i) => db.update(photos).set({ [f.fk]: rowId, sort_order: i }).where(eq(photos.id, pid))),
    ];
  });
  if (stmts.length) await db.batch(stmts as [typeof stmts[number], ...typeof stmts]);
  return rowId!;
}

/** Deletes a row the caller may delete. Returns the photos that belonged to it (their files are removed by the caller). */
export async function deleteRow(db: Db, a: Actor, key: EntityKey, id: string) {
  const t = T(key);
  const r = await rawRow(db, key, id);
  if (!r || !canDelete(a, owned(r))) throw new DataError("deleteFailed");
  const { all } = await rowPhotoIds(db, key, id, r);
  const files = all.length
    ? await db.select({ id: photos.id, static_path: photos.static_path, uploaded_by: photos.uploaded_by }).from(photos).where(inArray(photos.id, all))
    : [];
  const own = files.filter((p) => !p.static_path);
  await db.batch([
    db.delete(t).where(eq(t.id, id)),
    ...(own.length ? [db.delete(photos).where(inArray(photos.id, own.map((p) => p.id)))] : []),
  ]);
  return own;
}

/** Staff review. Returns the row's photo ids (approve: the caller publishes their files first). */
export async function reviewRow(db: Db, a: Actor, key: EntityKey, id: string, action: "approve" | "reject" | "hide", reason: string) {
  if (!canReview(a)) throw new DataError("forbidden");
  const r = reason.trim().slice(0, 500);
  if (action === "reject" && !r) throw new DataError("reasonRequired");
  const row = await rawRow(db, key, id);
  if (!row) throw new DataError("reviewFailed");
  return { photoIds: (await rowPhotoIds(db, key, id, row)).all, reason: r };
}

/** Second half of a review, after the files were published. */
export async function setReviewStatus(db: Db, a: Actor, key: EntityKey, id: string, action: "approve" | "reject" | "hide", reason: string, photoIds: string[]) {
  if (!canReview(a)) throw new DataError("forbidden");
  const t = T(key);
  const status: ReviewStatus = action === "approve" ? "approved" : action === "reject" ? "rejected" : "hidden";
  const at = nowIso();
  await db.batch([
    db.update(t).set({ status, reviewed_by: a!.id, reviewed_at: at, reason: action === "reject" ? reason : null, updated_at: at }).where(eq(t.id, id)),
    ...(action === "approve" && photoIds.length
      ? [db.update(photos).set({ status: "approved", reviewed_by: a!.id, reviewed_at: at }).where(inArray(photos.id, photoIds))]
      : []),
  ]);
}

/** Text fields of a row for "duplicate" (the caller must be able to read it). */
export async function duplicateSource(db: Db, a: Actor, key: EntityKey, id: string) {
  return getRow(db, a, key, id);
}
