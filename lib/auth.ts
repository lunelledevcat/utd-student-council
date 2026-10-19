import "server-only";
import { redirect } from "next/navigation";
import { adminEmails, isAllowedEmail, supabaseConfigured } from "@/lib/env";
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
  if (adminEmails().includes(email)) return "admin";
  const { data } = await adminClient().from("profiles").select("role").eq("id", id).maybeSingle();
  return data?.role === "council" || data?.role === "teacher" ? data.role : null;
}

/** Verified session (token validated by the Auth server) + domain re-check + role. null = not logged in / wrong domain. */
export async function getSession(): Promise<Session | null> {
  if (!supabaseConfigured()) return null;
  const { data } = await (await createClient()).auth.getUser();
  const u = data.user;
  const email = u?.email?.toLowerCase();
  if (!u || !email || !isAllowedEmail(email)) return null;
  return { id: u.id, email, role: await resolveRole(u.id, email) };
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
