// Every access rule of the data layer (what RLS + triggers enforced on Supabase), against a real D1.
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import * as content from "@/lib/data/content";
import * as ent from "@/lib/data/entities";
import * as adm from "@/lib/data/admin";
import * as ph from "@/lib/data/photos";
import { DataError, canDelete, canEdit, canRead, writable, type Actor } from "@/lib/data/rules";
import { academic_years, activities, advisors, announcements, audit_logs, members, photos, policies, rate_hits, role_invites, sessions, users } from "@/lib/db/schema";
import type { Db } from "@/lib/db/types";
import { testDb } from "@/lib/data/test-db";

let db: Db;
let dispose: () => Promise<void>;
const Y = 2569;
const anon: Actor = null;
const council: Actor = { id: "u-council", email: "c@utd.ac.th", role: "council" };
const other: Actor = { id: "u-other", email: "o@utd.ac.th", role: "council" };
const teacher: Actor = { id: "u-teacher", email: "t@utd.ac.th", role: "teacher" };
const admin: Actor = { id: "u-admin", email: "a@utd.ac.th", role: "admin" };
const noRole: Actor = { id: "u-none", email: "n@utd.ac.th", role: null };
const ann = (title: string) => ({ title, published_on: "2026-10-19", title_en: "", body: "", body_en: "", link_url: null, pinned: false, cover_photo_id: null });
const code = async (p: Promise<unknown>) => p.then(() => "ok", (e) => (e instanceof DataError ? e.key : `crash: ${e}`));

beforeAll(async () => ({ db, dispose } = await testDb()));
afterAll(() => dispose());
beforeEach(async () => {
  for (const t of [photos, announcements, activities, policies, members, advisors, audit_logs, sessions, role_invites, rate_hits, users, academic_years]) await db.delete(t);
  await db.insert(academic_years).values({ year: Y, is_current: true });
});

describe("pure rules", () => {
  const own = { status: "pending" as const, owner: "u-council" };
  it("read", () => {
    expect(canRead(anon, { status: "approved", owner: "x" })).toBe(true);
    expect(canRead(anon, own)).toBe(false);
    expect(canRead(council, own)).toBe(true);
    expect(canRead(other, own)).toBe(false);
    expect(canRead(noRole, own)).toBe(false);
    expect(canRead(teacher, own)).toBe(true);
  });
  it("edit / delete", () => {
    expect(canEdit(council, own)).toBe(true);
    expect(canEdit(council, { ...own, status: "rejected" })).toBe(true);
    expect(canEdit(council, { ...own, status: "approved" })).toBe(false);
    expect(canEdit(other, own)).toBe(false);
    expect(canEdit(teacher, { ...own, status: "approved" })).toBe(true);
    expect(canDelete(council, own)).toBe(true);
    expect(canDelete(council, { ...own, status: "rejected" })).toBe(false);
    expect(canDelete(admin, { ...own, status: "approved" })).toBe(true);
  });
  it("writable strips review columns; council always pending", () => {
    const w = writable(council, { title: "x", status: "approved", reviewed_by: "me", author_id: "x", is_hero: true });
    expect(w).toEqual({ title: "x", status: "pending" });
    expect(writable(teacher, { title: "x", status: "approved" })).toEqual({ title: "x" });
  });
});

describe("content rows", () => {
  it("council creates as self + pending; anonymous / no-role cannot create", async () => {
    const id = await ent.saveRow(db, council, "announcements", null, Y, { ...ann("A"), status: "approved" }, {});
    const [r] = await db.select().from(announcements).where(eq(announcements.id, id));
    expect(r.status).toBe("pending");
    expect(r.author_id).toBe("u-council");
    expect(await code(ent.saveRow(db, anon, "announcements", null, Y, ann("B"), {}))).toBe("forbidden");
    expect(await code(ent.saveRow(db, noRole, "announcements", null, Y, ann("B"), {}))).toBe("forbidden");
  });

  it("public sees approved only; council sees approved + own; staff sees all", async () => {
    const mine = await ent.saveRow(db, council, "announcements", null, Y, ann("mine"), {});
    const theirs = await ent.saveRow(db, other, "announcements", null, Y, ann("theirs"), {});
    const pub = await ent.saveRow(db, other, "announcements", null, Y, ann("public"), {});
    const { photoIds } = await ent.reviewRow(db, teacher, "announcements", pub, "approve", "");
    await ent.setReviewStatus(db, teacher, "announcements", pub, "approve", "", photoIds);

    expect((await content.yearRows(db, Y)).ann.map((r) => r.title)).toEqual(["public"]);
    expect((await ent.listRows(db, council, "announcements", Y)).rows.map((r) => r.title).sort()).toEqual(["mine", "public"]);
    expect((await ent.listRows(db, teacher, "announcements", Y)).total).toBe(3);
    expect(await ent.getRow(db, council, "announcements", theirs)).toBeNull();
    expect(await ent.getRow(db, council, "announcements", mine)).not.toBeNull();
    expect(await ent.getRow(db, anon, "announcements", mine)).toBeNull();
  });

  it("council edits own pending/rejected (back to pending), never approved or others'", async () => {
    const id = await ent.saveRow(db, council, "announcements", null, Y, ann("v1"), {});
    expect(await code(ent.saveRow(db, other, "announcements", id, Y, ann("hack"), {}))).toBe("editLocked");
    await ent.setReviewStatus(db, teacher, "announcements", id, "reject", "fix it", []);
    await ent.saveRow(db, council, "announcements", id, Y, { ...ann("v2"), status: "approved" }, {});
    let [r] = await db.select().from(announcements).where(eq(announcements.id, id));
    expect([r.title, r.status, r.reason]).toEqual(["v2", "pending", "fix it"]);
    await ent.setReviewStatus(db, teacher, "announcements", id, "approve", "", []);
    expect(await code(ent.saveRow(db, council, "announcements", id, Y, ann("v3"), {}))).toBe("editLocked");
    await ent.saveRow(db, teacher, "announcements", id, Y, ann("staff edit"), {});
    [r] = await db.select().from(announcements).where(eq(announcements.id, id));
    expect([r.title, r.status]).toEqual(["staff edit", "approved"]); // staff edits keep the status
  });

  it("delete: council own pending only; staff anything", async () => {
    const id = await ent.saveRow(db, council, "announcements", null, Y, ann("x"), {});
    expect(await code(ent.deleteRow(db, other, "announcements", id))).toBe("deleteFailed");
    await ent.setReviewStatus(db, teacher, "announcements", id, "approve", "", []);
    expect(await code(ent.deleteRow(db, council, "announcements", id))).toBe("deleteFailed");
    expect(await code(ent.deleteRow(db, admin, "announcements", id))).toBe("ok");
  });

  it("review: staff only; reject needs a reason", async () => {
    const id = await ent.saveRow(db, council, "announcements", null, Y, ann("x"), {});
    expect(await code(ent.reviewRow(db, council, "announcements", id, "approve", ""))).toBe("forbidden");
    expect(await code(ent.setReviewStatus(db, council, "announcements", id, "approve", "", []))).toBe("forbidden");
    expect(await code(ent.reviewRow(db, teacher, "announcements", id, "reject", " "))).toBe("reasonRequired");
  });

  it("policy slug must be unique", async () => {
    const p = { title: "P", slug: "same", summary: "", summary_en: "", title_en: "", body: "", body_en: "", progress_status: "planned", progress: 0, owner: "", owner_en: "", timeline: [], sort_order: 0, cover_photo_id: null };
    await ent.saveRow(db, council, "policies", null, Y, p, { photos: [] });
    expect(await code(ent.saveRow(db, council, "policies", null, Y, p, { photos: [] }))).toBe("slugTaken");
  });
});

describe("photos", () => {
  it("members register own uploads as pending; anonymous cannot", async () => {
    await ph.insertPhoto(db, council, { id: "p1", width: 10, height: 10, blur: null });
    const [p] = await db.select().from(photos).where(eq(photos.id, "p1"));
    expect([p.status, p.uploaded_by]).toEqual(["pending", "u-council"]);
    expect(await code(ph.insertPhoto(db, anon, { id: "p2", width: 1, height: 1, blur: null }))).toBe("forbidden");
  });

  it("IDOR: council cannot attach someone else's photo, even an approved one; staff can", async () => {
    await ph.insertPhoto(db, other, { id: "theirs", width: 10, height: 10, blur: null });
    await db.update(photos).set({ status: "approved" }).where(eq(photos.id, "theirs"));
    await ph.insertPhoto(db, council, { id: "mine", width: 10, height: 10, blur: null });
    const act = { title: "A", title_en: "", event_date: "2026-10-19", body: "", body_en: "" };
    expect(await code(ent.saveRow(db, council, "activities", null, Y, act, { photos: ["theirs"] }))).toBe("photoNotAllowed");
    const id = await ent.saveRow(db, council, "activities", null, Y, act, { photos: ["mine"] });
    expect((await ent.rowPhotoIds(db, "activities", id)).all).toEqual(["mine"]);
    expect(await code(ent.saveRow(db, teacher, "activities", null, Y, act, { photos: ["theirs"] }))).toBe("ok");
  });

  it("approval publishes the row's photos; public sees only approved photos; delete removes photo rows", async () => {
    await ph.insertPhoto(db, council, { id: "g1", width: 10, height: 10, blur: null });
    const id = await ent.saveRow(db, council, "activities", null, Y, { title: "A", title_en: "", event_date: "2026-10-19", body: "", body_en: "" }, { photos: ["g1"] });
    await ent.setReviewStatus(db, teacher, "activities", id, "approve", "", []);
    expect((await content.yearRows(db, Y)).imgs).toHaveLength(0); // row approved, photo still pending
    const { photoIds } = await ent.reviewRow(db, teacher, "activities", id, "approve", "");
    await ent.setReviewStatus(db, teacher, "activities", id, "approve", "", photoIds);
    expect((await content.yearRows(db, Y)).imgs.map((p) => p.id)).toEqual(["g1"]);
    const gone = await ent.deleteRow(db, admin, "activities", id);
    expect(gone.map((p) => p.id)).toEqual(["g1"]);
    expect(await db.select().from(photos)).toHaveLength(0);
  });

  it("hero: staff only, approved photos only", async () => {
    await ph.insertPhoto(db, council, { id: "h", width: 10, height: 10, blur: null });
    expect(await code(ph.setHero(db, council, "h", true, 1))).toBe("forbidden");
    expect(await code(ph.setHero(db, teacher, "h", true, 1))).toBe("saveFailed");
    await db.update(photos).set({ status: "approved" }).where(eq(photos.id, "h"));
    expect(await code(ph.setHero(db, teacher, "h", true, 1))).toBe("ok");
    expect((await content.heroPhotos(db)).map((p) => p.id)).toEqual(["h"]);
  });
});

describe("members contacts + admin", () => {
  it("public rows carry contacts only with consent (filtering in lib/content.ts) — data shows consent flag", async () => {
    const m = { name: "M", role_title: "r", dept: "d", instagram: "ig", contact: "c", consent_public: false };
    const id = await ent.saveRow(db, council, "members", null, Y, m, {});
    await ent.setReviewStatus(db, teacher, "members", id, "approve", "", []);
    const [r] = (await content.yearRows(db, Y)).mem;
    expect(r.consent_public).toBe(false);
  });

  it("years + security summary: admin only", async () => {
    expect(await code(adm.addYear(db, teacher, 2570, null))).toBe("forbidden");
    expect(await code(adm.addYear(db, admin, 2570, Y))).toBe("ok");
    expect(await code(adm.addYear(db, admin, 2570, null))).toBe("yearExists");
    expect(await code(adm.setCurrentYear(db, council, 2570))).toBe("forbidden");
    expect(await code(adm.securitySummary(db, teacher, "2000-01-01"))).toBe("forbidden");
  });

  it("actorFor: domain + verified rule, ADMIN_EMAILS promote/demote with audit, invite applied on sign-in", async () => {
    process.env.ADMIN_EMAILS = "boss@gmail.com";
    process.env.ALLOWED_EMAIL_DOMAIN = "utd.ac.th";
    await db.insert(users).values([
      { id: "a", email: "boss@gmail.com", emailVerified: new Date() },
      { id: "s", email: "student@utd.ac.th", emailVerified: new Date() },
      { id: "x", email: "x@gmail.com", emailVerified: new Date() },
      { id: "u", email: "unverified@utd.ac.th", emailVerified: null },
      { id: "old", email: "old@utd.ac.th", emailVerified: new Date(), role: "admin" },
    ]);
    expect((await adm.actorFor(db, "a"))?.role).toBe("admin");
    expect((await adm.actorFor(db, "s"))?.role).toBeNull(); // signed in, no access -> /pending-access
    expect(await adm.actorFor(db, "x")).toBeNull();
    expect(await adm.actorFor(db, "u")).toBeNull();
    expect((await adm.actorFor(db, "old"))?.role).toBeNull(); // removed from ADMIN_EMAILS -> demoted
    const [old] = await db.select().from(users).where(eq(users.id, "old"));
    expect(old.role).toBeNull();
    expect((await db.select().from(audit_logs)).map((r) => r.action)).toEqual(expect.arrayContaining(["role.change"]));

    const { role_invites } = await import("@/lib/db/schema");
    await db.insert(role_invites).values({ email: "student@utd.ac.th", role: "council" });
    await adm.onSignIn(db, "s", "student@utd.ac.th");
    expect((await adm.actorFor(db, "s"))?.role).toBe("council");
  });

  it("sign out everywhere deletes all sessions of the user", async () => {
    await db.insert(users).values({ id: "s", email: "s@utd.ac.th", emailVerified: new Date() });
    const exp = new Date(Date.now() + 864e5);
    await db.insert(sessions).values([{ sessionToken: "t1", userId: "s", expires: exp }, { sessionToken: "t2", userId: "s", expires: exp }]);
    await adm.signOutEverywhere(db, "s");
    expect(await db.select().from(sessions)).toHaveLength(0);
  });

  it("rate limit window (D1)", async () => {
    for (let i = 0; i < 5; i++) expect((await adm.hit(db, "login:ip", 5, 900_000)).ok).toBe(true);
    const r = await adm.hit(db, "login:ip", 5, 900_000);
    expect(r.ok).toBe(false);
    expect(r.retryAfter).toBeGreaterThan(0);
  });
});
