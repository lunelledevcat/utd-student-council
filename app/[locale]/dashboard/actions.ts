"use server";

import { revalidatePath } from "next/cache";
import { ENTITIES, isEntity, rowColumns, type Entity, type EntityKey, type Field } from "@/lib/admin/entities";
import { previewUrls, processRaw, publishPhotos, signedRawUpload } from "@/lib/admin/photos";
import { MEMBERS, STAFF, audit, getSession, type Role, type Session } from "@/lib/auth";
import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { limit } from "@/lib/ratelimit";
import { adminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// Every action re-checks the caller's role (never trusts the UI). Content writes go through the caller's own
// session client so RLS + the lock_review_columns trigger stay the boundary (council rows are always 'pending').
// The service role is used only after the role check, for review, publishing photos, years and hero settings.
// Errors are message keys under dashboard.errors (the client translates them).

type Err = { key: string; values?: Record<string, number> };
export type Result = { ok: true } | { ok: false; error: Err };
export type FormState = { ok: boolean; error?: Err; fieldErrors?: Record<string, Err> };

const fail = (key: string, values?: Record<string, number>) => ({ ok: false as const, error: { key, values } });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const validDate = (s: string) => DATE.test(s) && !Number.isNaN(Date.parse(s));

async function role(allowed: Role[]): Promise<(Session & { role: Role }) | null> {
  const s = await getSession();
  return s?.role && allowed.includes(s.role) ? (s as Session & { role: Role }) : null;
}

type Parsed = { values: Record<string, unknown>; images: Record<string, string[]>; errors: Record<string, Err> };

/** FormData -> column values, validated against the entity config. English columns are optional. */
function parse(e: Entity, fd: FormData): Parsed {
  const values: Record<string, unknown> = {};
  const images: Record<string, string[]> = {};
  const errors: Record<string, Err> = {};
  const str = (n: string) => String(fd.get(n) ?? "").replace(/\r\n/g, "\n").trim();

  for (const f of e.fields as Field[]) {
    const v = str(f.name);
    switch (f.kind) {
      case "text":
      case "textarea": {
        if (f.required && !v) errors[f.name] = { key: "required" };
        else if (v.length > f.max) errors[f.name] = { key: "tooLong", values: { max: f.max } };
        else if (f.kind === "text" && f.pattern && v && !new RegExp(f.pattern.re).test(v)) errors[f.name] = { key: f.pattern.error };
        values[f.name] = f.name === "instagram" ? v.replace(/^@/, "") : v;
        if (f.en) {
          const en = str(`${f.name}_en`);
          if (en.length > f.max) errors[`${f.name}_en`] = { key: "tooLong", values: { max: f.max } };
          values[`${f.name}_en`] = en;
        }
        break;
      }
      case "date":
        if (!validDate(v)) errors[f.name] = { key: "badDate" };
        values[f.name] = v;
        break;
      case "url": {
        let ok = !v;
        try { ok ||= new URL(v).protocol === "https:"; } catch { /* invalid */ }
        if (!ok) errors[f.name] = { key: "badUrl" };
        values[f.name] = v || null;
        break;
      }
      case "number": {
        const n = v === "" ? f.min : Number(v);
        if (!Number.isInteger(n) || n < f.min || n > f.max) errors[f.name] = { key: "badNumber", values: { min: f.min, max: f.max } };
        values[f.name] = n;
        break;
      }
      case "select":
        if (!f.options.includes(v)) errors[f.name] = { key: "badChoice" };
        values[f.name] = v;
        break;
      case "checkbox":
        values[f.name] = fd.get(f.name) === "on";
        break;
      case "timeline": {
        const en = str(`${f.name}_en`).split("\n").map((l) => l.trim());
        const steps: { date: string; text: string; text_en?: string }[] = [];
        v.split("\n").map((l) => l.trim()).filter(Boolean).forEach((line, i) => {
          const [d, ...rest] = line.split("|");
          const text = rest.join("|").trim();
          if (!validDate(d.trim()) || !text) errors[f.name] ??= { key: "badTimeline", values: { line: i + 1 } };
          else steps.push({ date: d.trim(), text: text.slice(0, 300), ...(en[i] ? { text_en: en[i].slice(0, 300) } : {}) });
        });
        if (steps.length > 50) errors[f.name] = { key: "tooManyTimeline" };
        if (en.filter(Boolean).length > steps.length && !errors[f.name]) errors[`${f.name}_en`] = { key: "timelineEnCount" };
        values[f.name] = steps;
        break;
      }
      case "image":
        if (v && !UUID.test(v)) errors[f.name] = { key: "badImage" };
        values[f.name] = v || null;
        break;
      case "images": {
        const ids = fd.getAll(f.name).map(String).filter(Boolean);
        if (ids.some((id) => !UUID.test(id)) || ids.length > 60) errors[f.name] = { key: "badImages" };
        images[f.name] = [...new Set(ids)];
        break;
      }
    }
  }
  return { values, images, errors };
}

export async function saveEntity(key: EntityKey, id: string | null, year: number, locale: string, _prev: FormState, fd: FormData): Promise<FormState> {
  if (!isEntity(key) || (id !== null && !UUID.test(id)) || !Number.isInteger(year)) return fail("badRequest");
  const s = await role(MEMBERS);
  if (!s) return fail("forbidden");
  const e = ENTITIES[key];
  const { values, images, errors } = parse(e, fd);
  if (Object.keys(errors).length) return { ok: false, error: { key: "fix" }, fieldErrors: errors };

  const db = await createClient();

  // every referenced photo must be readable by the caller (RLS: own uploads, or any for staff)
  const photoIds = [...e.fields.filter((f) => f.kind === "image").map((f) => values[f.name] as string | null), ...Object.values(images).flat()].filter(
    (x): x is string => !!x,
  );
  if (photoIds.length) {
    const { data } = await db.from("photos").select("id").in("id", photoIds);
    if ((data ?? []).length !== new Set(photoIds).size) return fail("photoNotAllowed");
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

  // link gallery photos: the caller just proved edit rights on the row (RLS) and read rights on the photos
  for (const f of e.fields) {
    if (f.kind !== "images") continue;
    const ids = images[f.name];
    const admin = adminClient();
    let unlink = admin.from("photos").update({ [f.fk]: null }).eq(f.fk, rowId);
    if (ids.length) unlink = unlink.not("id", "in", `(${ids.join(",")})`);
    await unlink;
    for (const [i, pid] of ids.entries()) await admin.from("photos").update({ [f.fk]: rowId, sort_order: i }).eq("id", pid);
  }

  await audit(s, id ? "update" : "create", key, rowId);
  redirect({ href: { pathname: `/dashboard/${key}`, query: { year: String(year), saved: "1" } }, locale: routing.locales.includes(locale as "th") ? (locale as "th") : "th" });
  return { ok: true };
}

export async function deleteEntity(key: EntityKey, id: string): Promise<Result> {
  if (!isEntity(key) || !UUID.test(id)) return fail("badRequest");
  const s = await role(MEMBERS);
  if (!s) return fail("forbidden");
  const { error, count } = await (await createClient()).from(key).delete({ count: "exact" }).eq("id", id);
  if (error || !count) return fail("deleteFailed");
  await audit(s, "delete", key, id);
  revalidatePath("/[locale]/dashboard", "layout");
  return { ok: true };
}

/** Staff review: approve (also publishes the row's photos), reject (with reason) or hide. */
export async function reviewEntity(key: EntityKey, id: string, action: "approve" | "reject" | "hide", reason: string): Promise<Result> {
  if (!isEntity(key) || !UUID.test(id) || !["approve", "reject", "hide"].includes(action)) return fail("badRequest");
  const s = await role(STAFF);
  if (!s) return fail("forbidden");
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
  await audit(s, `review:${action}`, key, id, r ? { reason: r } : {});
  revalidatePath("/[locale]/dashboard", "layout");
  return { ok: true };
}

// ───────────────────────── photos ─────────────────────────

export async function createUploadUrl(): Promise<Result & { path?: string; url?: string }> {
  const s = await role(MEMBERS);
  if (!s) return fail("forbidden");
  const rl = await limit("upload", s.id);
  if (!rl.ok) return fail("rate", { min: Math.ceil(rl.retryAfter / 60) });
  try {
    return { ok: true, ...(await signedRawUpload(s.id)) };
  } catch {
    return fail("upload");
  }
}

export async function finalizeUpload(rawPath: string): Promise<Result & { id?: string; url?: string }> {
  const s = await role(MEMBERS);
  if (!s) return fail("forbidden");
  try {
    const p = await processRaw(String(rawPath), s.id);
    const { error } = await (await createClient())
      .from("photos")
      .insert({ id: p.id, width: p.width, height: p.height, blur: p.blur, caption: "", status: "pending", uploaded_by: s.id });
    if (error) throw error;
    const urls = await previewUrls([{ id: p.id, status: "pending" }]);
    return { ok: true, id: p.id, url: urls[p.id] ?? p.blur };
  } catch (err) {
    console.error("[dashboard] upload", err);
    return fail("upload");
  }
}

// ───────────────────────── academic years (admin) ─────────────────────────

export async function addYear(_prev: FormState, fd: FormData): Promise<FormState> {
  const s = await role(["admin"]);
  if (!s) return fail("forbidden");
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
  if (!s) return fail("forbidden");
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

export async function setHero(photoId: string, on: boolean, order: number): Promise<Result> {
  if (!UUID.test(photoId) || !Number.isInteger(order) || order < 0 || order > 999) return fail("badRequest");
  const s = await role(STAFF);
  if (!s) return fail("forbidden");
  const { error } = await adminClient().from("photos").update({ is_hero: on, hero_order: order }).eq("id", photoId).eq("status", "approved");
  if (error) return fail("saveFailed");
  await audit(s, on ? "hero:on" : "hero:off", "photos", photoId, { order });
  revalidatePath("/[locale]/dashboard", "layout");
  return { ok: true };
}
