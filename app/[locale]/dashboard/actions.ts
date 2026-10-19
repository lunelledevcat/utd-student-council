"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { ENTITIES, isEntity, rowColumns, type EntityKey } from "@/lib/admin/entities";
import { parse, type Err } from "@/lib/admin/validate";
import { checkIncoming, makeVariants, publishPhotos, removePhotoFiles, signedUpload } from "@/lib/admin/photos";
import { MEMBERS, STAFF, audit, authorize } from "@/lib/auth";
import { limit } from "@/lib/ratelimit";
import { logSecurity } from "@/lib/security-log";
import { adminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// Every action re-checks the caller's role (never trusts the UI). Content writes go through the caller's own
// session client so RLS + the lock_review_columns trigger stay the boundary (council rows are always 'pending').
// The service role is used only after the role check, for review, publishing photos, years and hero settings.
// Errors are message keys under dashboard.errors (the client translates them).

export type Result = { ok: true } | { ok: false; error: Err };
export type FormState = { ok: boolean; id?: string; error?: Err; fieldErrors?: Record<string, Err> };

const fail = (key: string, values?: Record<string, number>) => ({ ok: false as const, error: { key, values } });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const role = authorize;
/** Logged, then answered with the translated "forbidden". */
const denied = () => {
  after(() => logSecurity("forbidden", { detail: { at: "dashboard action" } }));
  return fail("forbidden");
};

export async function saveEntity(key: EntityKey, id: string | null, year: number, locale: string, _prev: FormState, fd: FormData): Promise<FormState> {
  if (!isEntity(key) || (id !== null && !UUID.test(id)) || !Number.isInteger(year)) return fail("badRequest");
  const s = await role(MEMBERS);
  if (!s) return denied();
  const e = ENTITIES[key];
  const { values, images, errors } = parse(e, fd);
  if (Object.keys(errors).length) return { ok: false, error: { key: "fix" }, fieldErrors: errors };

  const db = await createClient();

  // Photos the caller may attach: their own uploads, photos already on this row, or any photo for staff.
  // (Approved photos are publicly readable, so "can read it" is not enough — that would let a council member move
  // someone else's published photo onto their own row: IDOR.)
  const photoIds = [...new Set([...e.fields.filter((f) => f.kind === "image").map((f) => values[f.name] as string | null), ...Object.values(images).flat()].filter(
    (x): x is string => !!x,
  ))];
  if (photoIds.length && !STAFF.includes(s.role)) {
    const { data } = await adminClient().from("photos").select("id,uploaded_by,activity_id,policy_id").in("id", photoIds);
    let current: string[] = [];
    if (id) {
      const imageCols = e.fields.filter((f) => f.kind === "image").map((f) => f.name);
      const { data: row } = imageCols.length ? await db.from(key).select(imageCols.join(",")).eq("id", id).maybeSingle() : { data: null };
      current = imageCols.map((c) => (row as unknown as Record<string, string | null> | null)?.[c]).filter((x): x is string => !!x);
    }
    const allowed = (data ?? []).filter((p) => p.uploaded_by === s.id || current.includes(p.id) || (!!id && (p.activity_id === id || p.policy_id === id)));
    if (allowed.length !== photoIds.length) return fail("photoNotAllowed");
  }

  const cols = Object.fromEntries(rowColumns(e).map((c) => [c, values[c]]));
  const res = id
    ? await db.from(key).update(cols).eq("id", id).select("id").maybeSingle()
    : await db.from(key).insert({ ...cols, year, author_id: s.id, status: "pending" }).select("id").single();
  if (res.error || !res.data) {
    if (res.error?.code === "23505") return { ok: false, error: { key: "slugTaken" }, fieldErrors: { slug: { key: "slugTaken" } } };
    console.error("[dashboard] save", key, res.error?.message);
    return fail(id ? "editLocked" : "saveFailed");
  }
  const rowId = res.data.id as string;

  // link gallery photos: the caller just proved edit rights on the row (RLS) and read rights on the photos.
  // All updates go out in parallel (was one round-trip per photo).
  const admin = adminClient();
  await Promise.all(e.fields.flatMap((f) => {
    if (f.kind !== "images") return [];
    const ids = images[f.name];
    let unlink = admin.from("photos").update({ [f.fk]: null }).eq(f.fk, rowId);
    if (ids.length) unlink = unlink.not("id", "in", `(${ids.join(",")})`);
    return [unlink, ...ids.map((pid, i) => admin.from("photos").update({ [f.fk]: rowId, sort_order: i }).eq("id", pid))];
  }));

  after(() => audit(s, id ? "update" : "create", key, rowId));
  revalidatePath(`/${locale}/dashboard/${key}`);
  // navigation (back to the list, or a new blank form) is done by the client so the list can update optimistically
  return { ok: true, id: rowId };
}

export async function deleteEntity(key: EntityKey, id: string): Promise<Result> {
  if (!isEntity(key) || !UUID.test(id)) return fail("badRequest");
  const s = await role(MEMBERS);
  if (!s) return denied();
  // photos that belong only to this row (gallery rows cascade in the DB, but their files would stay in storage)
  const admin = adminClient();
  const e = ENTITIES[key];
  const imageCols = e.fields.filter((f) => f.kind === "image").map((f) => f.name);
  const fks = e.fields.flatMap((f) => (f.kind === "images" ? [f.fk] : []));
  const { data: row } = imageCols.length ? await admin.from(key).select(imageCols.join(",")).eq("id", id).maybeSingle() : { data: null };
  const single = imageCols.map((c) => (row as unknown as Record<string, string | null> | null)?.[c]).filter((x): x is string => !!x);
  const linked = (await Promise.all(fks.map((fk) => admin.from("photos").select("id").eq(fk, id)))).flatMap((r) => (r.data ?? []).map((p) => p.id as string));
  const photoIds = [...single, ...linked];
  const { data: photos } = photoIds.length ? await admin.from("photos").select("id,uploaded_by,static_path").in("id", photoIds) : { data: [] };

  const { error, count } = await (await createClient()).from(key).delete({ count: "exact" }).eq("id", id);
  if (error || !count) return fail("deleteFailed");
  const own = (photos ?? []).filter((p) => !p.static_path);
  if (own.length) {
    await admin.from("photos").delete().in("id", own.map((p) => p.id));
    after(() => Promise.all(own.map((p) => removePhotoFiles(p.id, p.uploaded_by))).catch((err) => console.error("[dashboard] remove files", err)));
  }
  after(() => audit(s, "delete", key, id));
  revalidatePath("/[locale]/dashboard", "layout");
  return { ok: true };
}

/** Staff review: approve (also publishes the row's photos), reject (with reason) or hide. */
export async function reviewEntity(key: EntityKey, id: string, action: "approve" | "reject" | "hide", reason: string): Promise<Result> {
  if (!isEntity(key) || !UUID.test(id) || !["approve", "reject", "hide"].includes(action)) return fail("badRequest");
  const s = await role(STAFF);
  if (!s) return denied();
  const r = String(reason ?? "").trim().slice(0, 500);
  if (action === "reject" && !r) return fail("reasonRequired");
  const e = ENTITIES[key];
  const db = adminClient();

  try {
    if (action === "approve") {
      const imageCols = e.fields.filter((f) => f.kind === "image").map((f) => f.name);
      const { data: row } = await db.from(key).select(["id", ...imageCols].join(",")).eq("id", id).single();
      const ids = imageCols.map((c) => (row as unknown as Record<string, string | null>)?.[c]).filter((x): x is string => !!x);
      for (const f of e.fields) {
        if (f.kind !== "images") continue;
        const { data } = await db.from("photos").select("id").eq(f.fk, id);
        ids.push(...(data ?? []).map((p) => p.id as string));
      }
      await publishPhotos(ids, s.id);
    }
    const status = action === "approve" ? "approved" : action === "reject" ? "rejected" : "hidden";
    const { error } = await db.from(key).update({ status, reviewed_by: s.id, reviewed_at: new Date().toISOString(), reason: action === "reject" ? r : null }).eq("id", id);
    if (error) throw error;
  } catch (err) {
    console.error("[dashboard] review", key, id, err);
    return fail("reviewFailed");
  }
  after(() => audit(s, `review:${action}`, key, id, r ? { reason: r } : {}));
  // the public pages and the back office show the new state on the next request
  revalidatePath("/[locale]", "layout");
  return { ok: true };
}

// ───────────────────────── photos ─────────────────────────

/** One-time URL for the browser to PUT an already-compressed WebP straight into storage (not through Next). */
export async function createUploadUrl(): Promise<Result & { id?: string; url?: string }> {
  const s = await role(MEMBERS);
  if (!s) return denied();
  const rl = await limit("upload", s.id);
  if (!rl.ok) return fail("rate", { min: Math.ceil(rl.retryAfter / 60) });
  try {
    return { ok: true, ...(await signedUpload(s.id)) };
  } catch (err) {
    console.error("[dashboard] upload url", err);
    return fail("upload");
  }
}

/** Registers an upload as a pending photo right away; variants are built in the background (after the response). */
export async function finalizeUpload(id: string, width: number, height: number): Promise<Result & { id?: string }> {
  const s = await role(MEMBERS);
  if (!s) return denied();
  if (!UUID.test(String(id)) || !Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width * height > 60_000_000) {
    return fail("badRequest");
  }
  try {
    const file = await checkIncoming(s.id, id);
    if (file === "missing") return fail("upload");
    if (file === "bad") {
      after(() => logSecurity("upload_rejected", { userId: s.id, detail: { id } }));
      return fail("badFile");
    }
    const { error } = await (await createClient())
      .from("photos")
      .insert({ id, width: Math.min(width, 1920), height: Math.round(height * Math.min(1, 1920 / width)), caption: "", status: "pending", uploaded_by: s.id });
    if (error) throw error;
    after(() => makeVariants(id, s.id).catch((err) => console.error("[dashboard] variants", id, err)));
    return { ok: true, id };
  } catch (err) {
    console.error("[dashboard] upload", err);
    return fail("upload");
  }
}

// ───────────────────────── academic years (admin) ─────────────────────────

export async function addYear(_prev: FormState, fd: FormData): Promise<FormState> {
  const s = await role(["admin"]);
  if (!s) return denied();
  const year = Number(fd.get("year"));
  const copyFrom = Number(fd.get("copyFrom")) || null;
  if (!Number.isInteger(year) || year < 2500 || year > 2700) return { ok: false, fieldErrors: { year: { key: "yearInvalid" } } };
  const db = adminClient();
  const { error } = await db.from("academic_years").insert({ year, is_current: false });
  if (error) return fail(error.code === "23505" ? "yearExists" : "yearFailed");

  if (copyFrom) {
    // copy the structure only: positions/order of council members (names left as placeholders) and the advisor list.
    // Copies start as 'pending' so nothing reaches the site before review.
    const [{ data: members }, { data: advisors }] = await Promise.all([
      db.from("members").select("role_title,role_title_en,term_no,exec_title,exec_title_en,dept,dept_en,sort_order").eq("year", copyFrom).neq("status", "hidden"),
      db.from("advisors").select("name,name_en,nickname,nickname_en,role_label,role_label_en,subject_group,subject_group_en,position,position_en,sort_order,photo_id").eq("year", copyFrom).neq("status", "hidden"),
    ]);
    const base = { year, status: "pending", author_id: s.id };
    if (members?.length) await db.from("members").insert(members.map((m) => ({ ...m, ...base, name: "[ชื่อ-สกุล]" })));
    if (advisors?.length) await db.from("advisors").insert(advisors.map((a) => ({ ...a, ...base })));
  }
  await audit(s, "year:add", "academic_years", String(year), copyFrom ? { copyFrom } : {});
  revalidatePath("/[locale]/dashboard", "layout");
  return { ok: true };
}

export async function setCurrentYear(year: number): Promise<Result> {
  const s = await role(["admin"]);
  if (!s) return denied();
  if (!Number.isInteger(year)) return fail("badRequest");
  const db = adminClient();
  const { data } = await db.from("academic_years").select("year").eq("year", year).maybeSingle();
  if (!data) return fail("badRequest");
  await db.from("academic_years").update({ is_current: false }).eq("is_current", true);
  await db.from("academic_years").update({ is_current: true }).eq("year", year);
  await audit(s, "year:current", "academic_years", String(year));
  revalidatePath("/[locale]/dashboard", "layout");
  return { ok: true };
}

// ───────────────────────── hero slides (staff) ─────────────────────────

/** Deletes a photo row (any photo, incl. banner files shipped in public/banner — the file itself stays) and its storage variants. */
export async function deletePhoto(photoId: string): Promise<Result> {
  if (!UUID.test(photoId)) return fail("badRequest");
  const s = await role(STAFF);
  if (!s) return denied();
  const db = adminClient();
  const { data: p } = await db.from("photos").select("static_path,uploaded_by").eq("id", photoId).maybeSingle();
  if (!p) return fail("badRequest");
  const { error } = await db.from("photos").delete().eq("id", photoId);
  if (error) return fail("deleteFailed");
  if (!p.static_path) await removePhotoFiles(photoId, p.uploaded_by);
  await audit(s, "photo:delete", "photos", photoId);
  revalidatePath("/[locale]/dashboard", "layout");
  return { ok: true };
}

export async function setHero(photoId: string, on: boolean, order: number): Promise<Result> {
  if (!UUID.test(photoId) || !Number.isInteger(order) || order < 0 || order > 999) return fail("badRequest");
  const s = await role(STAFF);
  if (!s) return denied();
  const { error } = await adminClient().from("photos").update({ is_hero: on, hero_order: order }).eq("id", photoId).eq("status", "approved");
  if (error) return fail("saveFailed");
  await audit(s, on ? "hero:on" : "hero:off", "photos", photoId, { order });
  revalidatePath("/[locale]/dashboard", "layout");
  return { ok: true };
}
