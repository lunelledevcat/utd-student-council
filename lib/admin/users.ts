import "server-only";
import { normalizeEmail } from "@/lib/env";
import { adminClient } from "@/lib/supabase/admin";

// public.allowed_users: who gets a back-office role (ADMIN_EMAILS aside). Read / written with the service role after
// the caller was checked to be an admin; the table itself is closed to every token (RLS, no policies).

export type AllowedUser = { email: string; role: "council" | "teacher"; active: boolean; shared: boolean; createdAt: string; createdBy: string | null };
export const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function listAllowed(): Promise<AllowedUser[]> {
  const { data } = await adminClient().from("allowed_users").select("email,role,active,shared,created_at,created_by").order("created_at");
  return (data ?? []).map((r) => ({
    email: r.email as string, role: r.role as AllowedUser["role"], active: !!r.active, shared: !!r.shared,
    createdAt: r.created_at as string, createdBy: (r.created_by as string | null) ?? null,
  }));
}

/** Adds an address (or updates role / shared of an existing one and switches it back on). */
export async function upsertAllowed(email: string, role: AllowedUser["role"], shared: boolean, by: string) {
  const e = normalizeEmail(email);
  const { error } = await adminClient().from("allowed_users")
    .upsert({ email: e, role, shared, active: true, created_by: by }, { onConflict: "email" });
  if (error) throw new Error(error.message);
  return e;
}

export async function updateAllowed(email: string, patch: Partial<Pick<AllowedUser, "active" | "shared" | "role">>) {
  const { error, count } = await adminClient().from("allowed_users").update(patch, { count: "exact" }).eq("email", normalizeEmail(email));
  if (error) throw new Error(error.message);
  if (!count) throw new Error("not found");
}

/** Shared accounts that can sign in now — flagged on /admin/setup. */
export async function activeSharedAccounts() {
  const { data } = await adminClient().from("allowed_users").select("email").eq("shared", true).eq("active", true);
  return (data ?? []).map((r) => r.email as string);
}
