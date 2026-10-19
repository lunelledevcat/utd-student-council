// Users + roles, academic years, voice, audit and security logs.
import { and, desc, eq, gte, lt, ne } from "drizzle-orm";
import { adminEmails, canSignIn, roleFor } from "@/lib/env";
import {
  academic_years, advisors, audit_logs, members, rate_hits, role_invites, security_events, sessions, users, voice_messages, voice_replies,
  type Role,
} from "@/lib/db/schema";
import type { Db } from "@/lib/db/types";
import { DataError, canAdminister, type Actor } from "@/lib/data/rules";

const nowIso = () => new Date().toISOString();

// ───────────────────────── users ─────────────────────────

/** Writes an audit row for a role change (was a database trigger). */
const roleChange = (db: Db, by: Actor, u: { id: string; email: string }, from: Role | null, to: Role | null) =>
  db.insert(audit_logs).values({ actor_id: by?.id ?? null, actor_email: by?.email ?? "system", action: "role.change", target_table: "users", target_id: u.id, detail: { email: u.email, from, to } });

/**
 * The caller's actor for a user id: sign-in rule re-checked, role from ADMIN_EMAILS (re-read every request) or the
 * stored role. The stored role follows ADMIN_EMAILS (promote/demote), so removing an address revokes admin at once.
 */
export async function actorFor(db: Db, userId: string): Promise<Actor> {
  const [u] = await db.select({ id: users.id, email: users.email, role: users.role, emailVerified: users.emailVerified }).from(users).where(eq(users.id, userId)).limit(1);
  if (!u || !canSignIn(u.email, !!u.emailVerified)) return null;
  const email = u.email.toLowerCase();
  const role = roleFor(email, u.role);
  const want = role === "admin" ? "admin" : u.role === "admin" ? null : u.role;
  if (want !== u.role) {
    await db.batch([db.update(users).set({ role: want }).where(eq(users.id, u.id)), roleChange(db, null, u, u.role, want)]);
  }
  return { id: u.id, email, role };
}

/** After a successful Google sign-in: apply a pending invite, stamp the login. */
export async function onSignIn(db: Db, userId: string, email: string) {
  const [u] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
  const e = email.toLowerCase();
  if (!u?.role && !adminEmails().includes(e)) {
    const [inv] = await db.select().from(role_invites).where(eq(role_invites.email, e)).limit(1);
    if (inv) {
      await db.batch([
        db.update(users).set({ role: inv.role }).where(eq(users.id, userId)),
        db.delete(role_invites).where(eq(role_invites.email, e)),
        roleChange(db, null, { id: userId, email: e }, null, inv.role),
      ]);
    }
  }
  await db.update(users).set({ last_login_at: nowIso() }).where(eq(users.id, userId));
}

/** Ends every session of the user (all devices). */
export async function signOutEverywhere(db: Db, userId: string) {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

// ───────────────────────── academic years (admin) ─────────────────────────

export async function addYear(db: Db, a: Actor, year: number, copyFrom: number | null) {
  if (!canAdminister(a)) throw new DataError("forbidden");
  if (!Number.isInteger(year) || year < 2500 || year > 2700) throw new DataError("yearInvalid");
  const [exists] = await db.select().from(academic_years).where(eq(academic_years.year, year)).limit(1);
  if (exists) throw new DataError("yearExists");
  await db.insert(academic_years).values({ year, is_current: false });
  if (!copyFrom) return;
  // structure only: positions of council members (names as placeholders) and the advisor list; copies start pending
  const [ms, as] = await Promise.all([
    db.select().from(members).where(and(eq(members.year, copyFrom), ne(members.status, "hidden"))),
    db.select().from(advisors).where(and(eq(advisors.year, copyFrom), ne(advisors.status, "hidden"))),
  ]);
  const base = { year, status: "pending" as const, author_id: a!.id, reviewed_by: null, reviewed_at: null, reason: null, created_at: nowIso(), updated_at: nowIso() };
  const stmts = [
    ...ms.map((m) => db.insert(members).values({ ...m, ...base, id: crypto.randomUUID(), name: "[ชื่อ-สกุล]", name_en: "", nickname: "", nickname_en: "", instagram: "", contact: "", consent_public: false, photo_id: null, party: "", party_en: "" })),
    ...as.map((v) => db.insert(advisors).values({ ...v, ...base, id: crypto.randomUUID(), instagram: "", contact: "", consent_public: false })),
  ];
  if (stmts.length) await db.batch(stmts as [typeof stmts[number], ...typeof stmts]);
}

export async function setCurrentYear(db: Db, a: Actor, year: number) {
  if (!canAdminister(a)) throw new DataError("forbidden");
  const [y] = await db.select().from(academic_years).where(eq(academic_years.year, year)).limit(1);
  if (!y) throw new DataError("badRequest");
  await db.batch([
    db.update(academic_years).set({ is_current: false }).where(eq(academic_years.is_current, true)),
    db.update(academic_years).set({ is_current: true }).where(eq(academic_years.year, year)),
  ]);
}

// ───────────────────────── voice ─────────────────────────

export async function saveVoice(db: Db, v: { code: string; category: string; message: string; anonymous: boolean; ip_hash: string }) {
  await db.insert(voice_messages).values({ ref_code: v.code, category: v.category, message: v.message, anonymous: v.anonymous, ip_hash: v.ip_hash, status: "received" });
}

/** Public lookup by code: status + latest approved reply only (never the message or hashes). */
export async function lookupVoice(db: Db, code: string) {
  const [m] = await db.select({ id: voice_messages.id, status: voice_messages.status }).from(voice_messages).where(eq(voice_messages.ref_code, code)).limit(1);
  if (!m) return null;
  const [r] = await db.select({ body: voice_replies.body }).from(voice_replies)
    .where(and(eq(voice_replies.voice_id, m.id), eq(voice_replies.status, "approved"))).orderBy(desc(voice_replies.created_at)).limit(1);
  return { status: m.status, reply: r?.body ?? null };
}

// ───────────────────────── logs ─────────────────────────

export async function audit(db: Db, a: Actor, action: string, table?: string, targetId?: string, detail: Record<string, unknown> = {}) {
  await db.insert(audit_logs).values({ actor_id: a?.id ?? null, actor_email: a?.email ?? null, action, target_table: table ?? null, target_id: targetId ?? null, detail });
}

export async function insertSecurityEvent(db: Db, e: { kind: string; ip_hash: string | null; user_id: string | null; path: string | null; detail: Record<string, unknown> }) {
  await db.insert(security_events).values(e);
}

/** /admin/security: last 7 days. */
export async function securitySummary(db: Db, a: Actor, sinceIso: string) {
  if (!canAdminister(a)) throw new DataError("forbidden");
  const [events, roles] = await Promise.all([
    db.select().from(security_events).where(gte(security_events.created_at, sinceIso)).orderBy(desc(security_events.created_at)).limit(500),
    db.select().from(audit_logs).where(and(eq(audit_logs.action, "role.change"), gte(audit_logs.created_at, sinceIso))).orderBy(desc(audit_logs.created_at)).limit(50),
  ]);
  return { events, roles };
}

/**
 * Long-window rate limit backed by D1 (consistent across instances): at most `max` hits per `windowMs` for `key`.
 * Old hits are pruned on the way.
 */
export async function hit(db: Db, key: string, max: number, windowMs: number) {
  const now = Date.now();
  await db.delete(rate_hits).where(and(eq(rate_hits.key, key), gte(rate_hits.at, 0), lt(rate_hits.at, now - windowMs)));
  const rows = await db.select({ at: rate_hits.at }).from(rate_hits).where(eq(rate_hits.key, key)).orderBy(rate_hits.at);
  if (rows.length >= max) return { ok: false, retryAfter: Math.max(1, Math.ceil((rows[0].at + windowMs - now) / 1000)) };
  await db.insert(rate_hits).values({ key, at: now });
  return { ok: true, retryAfter: 0 };
}
