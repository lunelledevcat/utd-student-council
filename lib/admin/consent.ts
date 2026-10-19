import "server-only";
import { adminClient } from "@/lib/supabase/admin";

// Council member portraits (scripts/import-2569.mjs): the files live in the private "pending" bucket under
// <photo_key>-{card,poster}.{avif,webp}. They are copied to the public bucket only while consent_photo = true and
// removed from it as soon as consent is withdrawn — so a file is never reachable without consent, not even by URL.

const FILES = ["card.avif", "card.webp", "poster.avif", "poster.webp"];
const paths = (key: string) => FILES.map((f) => `${key}-${f}`);

export type ConsentValue = true | false | null;
export type ConsentRow = { id: string; name: string; role: string; order: number; consent: ConsentValue; photoKey: string | null; preview: string | null };

/** Members of a year with their consent state and a 10-minute signed preview of the card (admin page only). */
export async function consentRows(year: number): Promise<ConsentRow[]> {
  const db = adminClient();
  const { data } = await db.from("members").select("id,name,role_title,sort_order,consent_photo,photo_key").eq("year", year).order("sort_order");
  const rows = data ?? [];
  const keys = rows.filter((r) => r.photo_key).map((r) => `${r.photo_key}-card.webp`);
  const { data: signed } = keys.length ? await db.storage.from("pending").createSignedUrls(keys, 600) : { data: [] };
  const url = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));
  return rows.map((r) => ({
    id: r.id as string, name: r.name as string, role: r.role_title as string, order: r.sort_order as number,
    consent: (r.consent_photo as ConsentValue) ?? null, photoKey: (r.photo_key as string | null) ?? null,
    preview: r.photo_key ? url.get(`${r.photo_key}-card.webp`) ?? null : null,
  }));
}

/** Sets consent for members and publishes / unpublishes their files to match. Returns how many were changed. */
export async function applyConsent(ids: string[], value: ConsentValue) {
  const db = adminClient();
  const { data } = await db.from("members").select("id,photo_key").in("id", ids);
  const rows = data ?? [];
  const store = db.storage;
  for (const r of rows.filter((x) => x.photo_key)) {
    const p = paths(r.photo_key as string);
    if (value === true) {
      for (const path of p) {
        const { error } = await store.from("pending").copy(path, path, { destinationBucket: "public" });
        if (error && !/exists/i.test(error.message)) throw new Error(`publish ${path}: ${error.message}`);
      }
    } else {
      const { error } = await store.from("public").remove(p);
      if (error) throw new Error(`unpublish ${r.photo_key}: ${error.message}`);
    }
  }
  const { error } = await db.from("members").update({ consent_photo: value }).in("id", rows.map((r) => r.id));
  if (error) throw new Error(error.message);
  return rows.length;
}
