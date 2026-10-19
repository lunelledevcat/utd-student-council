"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { ENTITIES, isEntity, type EntityKey } from "@/lib/admin/entities";
import { parse, type Err } from "@/lib/admin/validate";
import { MEMBERS, STAFF, audit, authorize } from "@/lib/auth";
import * as adm from "@/lib/data/admin";
import * as ent from "@/lib/data/entities";
import * as ph from "@/lib/data/photos";
import { DataError } from "@/lib/data/rules";
import { getDb } from "@/lib/db";
import { MAX_BYTES, checkUpload, publishFiles, removeFiles, uploadTargets, type Width } from "@/lib/media";
import { limit } from "@/lib/ratelimit";
import { logSecurity } from "@/lib/security-log";

// Every action re-checks the caller (authorize) and then goes through lib/data/*, which holds every access rule
// (council rows always pending, own rows only, staff review, ...). Errors are message keys under dashboard.errors.

export type Result = { ok: true } | { ok: false; error: Err };
export type FormState = { ok: boolean; id?: string; error?: Err; fieldErrors?: Record<string, Err> };

const fail = (key: string, values?: Record<string, number>) => ({ ok: false as const, error: { key, values } });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
/** Logged, then answered with the translated "forbidden". */
const denied = () => {
  after(() => logSecurity("forbidden", { detail: { at: "dashboard action" } }));
  return fail("forbidden");
};
/** DataError -> its message key; anything else is logged and answered with `fallback`. */
const failed = (err: unknown, fallback: string, where: string) => {
  if (err instanceof DataError) return err.key === "forbidden" ? denied() : fail(err.key, err.values);
  console.error(`[dashboard] ${where}`, err);
  return fail(fallback);
};

export async function saveEntity(key: EntityKey, id: string | null, year: number, locale: string, _prev: FormState, fd: FormData): Promise<FormState> {
  if (!isEntity(key) || (id !== null && !UUID.test(id)) || !Number.isInteger(year)) return fail("badRequest");
  const s = await authorize(MEMBERS);
  if (!s) return denied();
  const { values, images, errors } = parse(ENTITIES[key], fd);
  if (Object.keys(errors).length) return { ok: false, error: { key: "fix" }, fieldErrors: errors };
  try {
    const rowId = await ent.saveRow(getDb(), s, key, id, year, values, images);
    after(() => audit(s, id ? "update" : "create", key, rowId));
    revalidatePath(`/${locale}/dashboard/${key}`);
    // navigation (back to the list, or a new blank form) is done by the client so the list can update optimistically
    return { ok: true, id: rowId };
  } catch (err) {
    if (err instanceof DataError && err.key === "slugTaken") return { ok: false, error: { key: "slugTaken" }, fieldErrors: { slug: { key: "slugTaken" } } };
    return failed(err, id ? "editLocked" : "saveFailed", "save");
  }
}

export async function deleteEntity(key: EntityKey, id: string): Promise<Result> {
  if (!isEntity(key) || !UUID.test(id)) return fail("badRequest");
  const s = await authorize(MEMBERS);
  if (!s) return denied();
  try {
    const own = await ent.deleteRow(getDb(), s, key, id);
    after(() => Promise.all(own.map((p) => removeFiles(p.id, p.uploaded_by))).catch((err) => console.error("[dashboard] remove files", err)));
  } catch (err) {
    return failed(err, "deleteFailed", "delete");
  }
  after(() => audit(s, "delete", key, id));
  revalidatePath("/[locale]/dashboard", "layout");
  return { ok: true };
}

/** Staff review: approve (also moves the row's photos to public), reject (with reason) or hide. */
export async function reviewEntity(key: EntityKey, id: string, action: "approve" | "reject" | "hide", reason: string): Promise<Result> {
  if (!isEntity(key) || !UUID.test(id) || !["approve", "reject", "hide"].includes(action)) return fail("badRequest");
  const s = await authorize(STAFF);
  if (!s) return denied();
  const db = getDb();
  try {
    const r = await ent.reviewRow(db, s, key, id, action, String(reason ?? ""));
    if (action === "approve") await publishFiles(await ph.photosByIds(db, r.photoIds));
    await ent.setReviewStatus(db, s, key, id, action, r.reason, r.photoIds);
    after(() => audit(s, `review:${action}`, key, id, r.reason ? { reason: r.reason } : {}));
  } catch (err) {
    return failed(err, "reviewFailed", "review");
  }
  // the public pages and the back office show the new state on the next request
  revalidatePath("/[locale]", "layout");
  return { ok: true };
}

// ───────────────────────── photos ─────────────────────────

/** Three 5-minute upload URLs (480/960/1920) for a new photo, each bound to the size the browser declared. */
export async function createUploadUrl(sizes: Record<Width, number>): Promise<Result & { id?: string; urls?: Record<Width, string> }> {
  const s = await authorize(MEMBERS);
  if (!s) return denied();
  const ok = [480, 960, 1920].every((w) => Number.isInteger(sizes?.[w as Width]) && sizes[w as Width] > 0 && sizes[w as Width] <= MAX_BYTES);
  if (!ok) return fail("badFile");
  const rl = await limit("upload", s.id);
  if (!rl.ok) return fail("rate", { min: Math.ceil(rl.retryAfter / 60) });
  try {
    return { ok: true, ...(await uploadTargets(s.id, sizes)) };
  } catch (err) {
    console.error("[dashboard] upload url", err);
    return fail("upload");
  }
}

/** Checks the uploaded bytes (magic bytes + WebP header + size) and registers the photo as pending. */
export async function finalizeUpload(id: string, width: number, height: number, blur: string): Promise<Result & { id?: string }> {
  const s = await authorize(MEMBERS);
  if (!s) return denied();
  if (!UUID.test(String(id)) || !Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > 1920) return fail("badRequest");
  const placeholder = typeof blur === "string" && /^data:image\/webp;base64,[A-Za-z0-9+/=]{1,4000}$/.test(blur) ? blur : null;
  try {
    const file = await checkUpload(s.id, id, { w: width, h: height });
    if (file === "missing") return fail("upload");
    if (file === "bad") {
      after(() => logSecurity("upload_rejected", { userId: s.id, detail: { id } }));
      return fail("badFile");
    }
    await ph.insertPhoto(getDb(), s, { id, width: file.w, height: file.h, blur: placeholder });
    return { ok: true, id };
  } catch (err) {
    return failed(err, "upload", "upload");
  }
}

// ───────────────────────── academic years (admin) ─────────────────────────

export async function addYear(_prev: FormState, fd: FormData): Promise<FormState> {
  const s = await authorize(["admin"]);
  if (!s) return denied();
  const year = Number(fd.get("year"));
  const copyFrom = Number(fd.get("copyFrom")) || null;
  try {
    await adm.addYear(getDb(), s, year, copyFrom);
  } catch (err) {
    if (err instanceof DataError && err.key === "yearInvalid") return { ok: false, fieldErrors: { year: { key: "yearInvalid" } } };
    return failed(err, "yearFailed", "year");
  }
  await audit(s, "year:add", "academic_years", String(year), copyFrom ? { copyFrom } : {});
  revalidatePath("/[locale]/dashboard", "layout");
  return { ok: true };
}

export async function setCurrentYear(year: number): Promise<Result> {
  const s = await authorize(["admin"]);
  if (!s) return denied();
  if (!Number.isInteger(year)) return fail("badRequest");
  try {
    await adm.setCurrentYear(getDb(), s, year);
  } catch (err) {
    return failed(err, "badRequest", "current year");
  }
  await audit(s, "year:current", "academic_years", String(year));
  revalidatePath("/[locale]/dashboard", "layout");
  return { ok: true };
}

// ───────────────────────── hero slides (staff) ─────────────────────────

/** Deletes a photo row (incl. banner files shipped in public/banner — that file itself stays) and its R2 files. */
export async function deletePhoto(photoId: string): Promise<Result> {
  if (!UUID.test(photoId)) return fail("badRequest");
  const s = await authorize(STAFF);
  if (!s) return denied();
  try {
    const db = getDb();
    const [row] = await ph.photosByIds(db, [photoId]);
    const p = await ph.deletePhotoRow(db, s, photoId);
    if (!p.static_path) await removeFiles(photoId, row?.uploaded_by ?? null);
  } catch (err) {
    return failed(err, "deleteFailed", "photo delete");
  }
  await audit(s, "photo:delete", "photos", photoId);
  revalidatePath("/[locale]/dashboard", "layout");
  return { ok: true };
}

export async function setHero(photoId: string, on: boolean, order: number): Promise<Result> {
  if (!UUID.test(photoId) || !Number.isInteger(order) || order < 0 || order > 999) return fail("badRequest");
  const s = await authorize(STAFF);
  if (!s) return denied();
  try {
    await ph.setHero(getDb(), s, photoId, !!on, order);
  } catch (err) {
    return failed(err, "saveFailed", "hero");
  }
  await audit(s, on ? "hero:on" : "hero:off", "photos", photoId, { order });
  revalidatePath("/[locale]/dashboard", "layout");
  return { ok: true };
}
