// Public reads: approved rows and approved photos only, contacts only with consent. Anonymous by design — there is
// no actor here, so nothing private can leak through these functions. Callers: lib/content.ts (view models).
import { and, asc, desc, eq, inArray, or, sql } from "drizzle-orm";
import { academic_years, activities, advisors, announcements, members, photos, policies } from "@/lib/db/schema";
import type { Db } from "@/lib/db/types";

export type PhotoRow = { id: string; width: number; height: number; blur: string | null; sort_order: number; activity_id: string | null; policy_id: string | null };
const IMG = { id: photos.id, width: photos.width, height: photos.height, blur: photos.blur, sort_order: photos.sort_order, activity_id: photos.activity_id, policy_id: photos.policy_id };

export async function years(db: Db) {
  return db.select().from(academic_years).orderBy(desc(academic_years.year));
}

/** Everything the public page shows for one year (approved only), plus the approved photos those rows use. */
export async function yearRows(db: Db, year: number) {
  const ok = <T extends { year: never; status: never }>(t: T) => and(eq(t.year, year), eq(t.status, "approved"));
  const [ann, act, pol, mem, adv] = await Promise.all([
    db.select().from(announcements).where(ok(announcements as never)).orderBy(desc(announcements.pinned), desc(announcements.published_on)),
    db.select().from(activities).where(ok(activities as never)).orderBy(desc(activities.event_date)),
    db.select().from(policies).where(ok(policies as never)).orderBy(asc(policies.sort_order)),
    db.select().from(members).where(ok(members as never)).orderBy(asc(members.sort_order)),
    db.select().from(advisors).where(ok(advisors as never)).orderBy(asc(advisors.sort_order)),
  ]);
  // photos: single-image columns + galleries of the approved activities/policies of this year (subqueries, so the
  // D1 limit of 100 bound parameters is never hit)
  const imgs = await db.select(IMG).from(photos).where(and(
    eq(photos.status, "approved"),
    or(
      inArray(photos.activity_id, db.select({ id: activities.id }).from(activities).where(ok(activities as never))),
      inArray(photos.policy_id, db.select({ id: policies.id }).from(policies).where(ok(policies as never))),
      inArray(photos.id, sql`(select cover_photo_id from announcements where year = ${year} and status = 'approved'
        union select cover_photo_id from policies where year = ${year} and status = 'approved'
        union select photo_id from members where year = ${year} and status = 'approved'
        union select photo_id from advisors where year = ${year} and status = 'approved')`),
    ),
  ));
  return { ann, act, pol, mem, adv, imgs };
}

export async function policyBySlug(db: Db, slug: string) {
  const [p] = await db.select().from(policies).where(and(eq(policies.slug, slug), eq(policies.status, "approved"))).limit(1);
  if (!p) return null;
  const imgs = await db.select(IMG).from(photos).where(and(eq(photos.status, "approved"), or(eq(photos.policy_id, p.id), p.cover_photo_id ? eq(photos.id, p.cover_photo_id) : undefined)));
  return { p, imgs };
}

export async function policySlugs(db: Db) {
  return (await db.select({ slug: policies.slug }).from(policies).where(eq(policies.status, "approved"))).map((r) => r.slug);
}

export async function heroPhotos(db: Db) {
  return db.select({ ...IMG, caption: photos.caption, static_path: photos.static_path, credit: photos.credit })
    .from(photos).where(and(eq(photos.is_hero, true), eq(photos.status, "approved"))).orderBy(asc(photos.hero_order));
}
