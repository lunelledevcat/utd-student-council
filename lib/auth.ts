import "server-only";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { canSignIn, roleFor, supabaseConfigured } from "@/lib/env";
import { adminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type Role = "council" | "teacher" | "admin";
export type Session = { id: string; email: string; role: Role | null };


/**
 * Role is NOT derived from the email domain (students have @utd.ac.th too):
 *  - admin  = address listed in ADMIN_EMAILS (re-evaluated on every request, so removing it revokes access)
 *  - others = profiles.role, set by an admin in /admin/users
 */
async function resolveRole(id: string, email: string): Promise<Role | null> {
  const db = adminClient();
  const { data } = await db.from("profiles").select("role").eq("id", id).maybeSingle();
  const stored = data?.role ?? null;
  const role = roleFor(email, stored);
  // Keep the database in step with ADMIN_EMAILS: RLS (public.is_staff) reads profiles.role, so an admin must be stored
  // as 'admin' to see/review others' rows through their own session, and someone removed from ADMIN_EMAILS must lose
  // that at the database level too (not only in the app), or their token would keep staff rights against the REST API.
  const want = role === "admin" ? "admin" : stored === "admin" ? null : stored;
  if (want !== stored) {
    const { error } = await db.from("profiles").upsert({ id, email, role: want });
    if (error) console.error("[auth] role sync failed", error.message);
  }
  return role;
}

/** Google's own "email verified" claim (Supabase keeps it in user_metadata and in the identity data). */
export function googleVerified(u: User) {
  return u.user_metadata?.email_verified === true || !!u.identities?.some((i) => i.provider === "google" && i.identity_data?.email_verified === true);
}

/** Verified session (token validated by the Auth server) + sign-in rule re-check + role. null = not logged in / not allowed. */
export async function getSession(): Promise<Session | null> {
  if (!supabaseConfigured()) return null;
  const { data } = await (await createClient()).auth.getUser();
  const u = data.user;
  const email = u?.email?.toLowerCase();
  if (!u || !email || !canSignIn(email, googleVerified(u))) return null;
  return { id: u.id, email, role: await resolveRole(u.id, email) };
}

/**
 * The one authorization check for Server Actions and route handlers: verified session (Auth server) + sign-in rule +
 * role in `allowed`. Returns null instead of throwing, so actions answer with a translated "forbidden".
 * Pages/layouts use requireRole() below (same rule, but redirects).
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

/** For server actions: throws (never trusts anything sent by the client). */
export async function assertRole(allowed: Role[]): Promise<Session & { role: Role }> {
  const s = await getSession();
  if (!s?.role || !allowed.includes(s.role)) throw new Error("forbidden");
  return s as Session & { role: Role };
}

export const STAFF: Role[] = ["teacher", "admin"];
export const MEMBERS: Role[] = ["council", "teacher", "admin"];

/** Called from the OAuth callback: create/refresh the profile and apply any pre-assigned role. */
export async function syncProfile(userId: string, email: string) {
  const db = adminClient();
  const { data: existing } = await db.from("profiles").select("role").eq("id", userId).maybeSingle();
  let role: Role | null = existing?.role === "council" || existing?.role === "teacher" ? existing.role : null;
  if (!role) {
    const { data: invite } = await db.from("role_invites").select("role").eq("email", email).maybeSingle();
    if (invite?.role === "council" || invite?.role === "teacher") {
      role = invite.role;
      await db.from("role_invites").delete().eq("email", email);
    }
  }
  await db.from("profiles").upsert({ id: userId, email, role, last_login_at: new Date().toISOString() });
}

export async function audit(actor: Pick<Session, "id" | "email">, action: string, table?: string, targetId?: string, detail: Record<string, unknown> = {}) {
  const { error } = await adminClient().from("audit_logs").insert({
    actor_id: actor.id,
    actor_email: actor.email,
    action,
    target_table: table ?? null,
    target_id: targetId ?? null,
    detail,
  });
  if (error) console.error("[audit] insert failed", error.message);
}
