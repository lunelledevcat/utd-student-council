// Photo rows (files live in R2, see lib/media.ts). Rules: members register their own uploads (pending);
// staff manage hero slides and may delete any photo.
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { photos } from "@/lib/db/schema";
import type { Db } from "@/lib/db/types";
import { DataError, canReview, isMember, type Actor } from "@/lib/data/rules";

export async function insertPhoto(db: Db, a: Actor, p: { id: string; width: number; height: number; blur: string | null }) {
  if (!isMember(a)) throw new DataError("forbidden");
  await db.insert(photos).values({ id: p.id, width: p.width, height: p.height, blur: p.blur, caption: "", status: "pending", uploaded_by: a.id });
}

export async function photosByIds(db: Db, ids: string[]) {
  return ids.length ? db.select({ id: photos.id, status: photos.status, uploaded_by: photos.uploaded_by, static_path: photos.static_path }).from(photos).where(inArray(photos.id, ids)) : [];
}

/** Approved photos for the hero manager (staff). */
export async function approvedPhotos(db: Db, a: Actor) {
  if (!canReview(a)) throw new DataError("forbidden");
  return db.select({ id: photos.id, caption: photos.caption, is_hero: photos.is_hero, hero_order: photos.hero_order, static_path: photos.static_path, credit: photos.credit })
    .from(photos).where(eq(photos.status, "approved"))
    .orderBy(desc(photos.is_hero), asc(photos.hero_order), desc(photos.created_at)).limit(200);
}

export async function setHero(db: Db, a: Actor, id: string, on: boolean, order: number) {
  if (!canReview(a)) throw new DataError("forbidden");
  const r = await db.update(photos).set({ is_hero: on, hero_order: order }).where(and(eq(photos.id, id), eq(photos.status, "approved"))).returning({ id: photos.id });
  if (!r.length) throw new DataError("saveFailed");
}

/** Staff: delete any photo row. Returns it (the caller removes its files unless it is a shipped banner). */
export async function deletePhotoRow(db: Db, a: Actor, id: string) {
  if (!canReview(a)) throw new DataError("forbidden");
  const [p] = await db.delete(photos).where(eq(photos.id, id)).returning({ id: photos.id, static_path: photos.static_path, status: photos.status });
  if (!p) throw new DataError("badRequest");
  return p;
}
