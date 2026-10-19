import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/lib/authjs";
import { actorFor, audit as auditRow } from "@/lib/data/admin";
import { MEMBERS, STAFF, type Actor } from "@/lib/data/rules";
import { getDb } from "@/lib/db";
import type { Role } from "@/lib/db/schema";

export type { Role };
export type Session = { id: string; email: string; role: Role | null };
export { MEMBERS, STAFF };

/**
 * Verified session: Auth.js looks the session token up in D1 (expired/revoked = none), then the sign-in rule and the
 * role are re-checked on every request (lib/data/admin.ts actorFor — ADMIN_EMAILS re-read each time).
 * null = not signed in / not allowed.
 */
export async function getSession(): Promise<Session | null> {
  const s = await auth();
  if (!s?.user?.id) return null;
  return actorFor(getDb(), s.user.id);
}

/**
 * The one authorization check for Server Actions and route handlers. Returns null instead of throwing, so actions
 * answer with a translated "forbidden". Pages/layouts use requireRole() (same rule, but redirects).
 */
export async function authorize(allowed: Role[]): Promise<(Session & { role: Role }) | null> {
  const s = await getSession();
  return s?.role && allowed.includes(s.role) ? (s as Session & { role: Role }) : null;
}

/** For pages/layouts: redirects when the caller lacks access. */
export async function requireRole(allowed: Role[]): Promise<Session & { role: Role }> {
  const s = await getSession();
  if (!s) redirect("/login");
  if (!s.role) redirect("/pending-access");
  if (!allowed.includes(s.role)) redirect("/dashboard?denied=1");
  return s as Session & { role: Role };
}

export async function audit(actor: Actor, action: string, table?: string, targetId?: string, detail: Record<string, unknown> = {}) {
  try {
    await auditRow(getDb(), actor, action, table, targetId, detail);
  } catch (err) {
    console.error("[audit] insert failed", err);
  }
}
