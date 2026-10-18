import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Db } from "@/lib/supabase/types";
import { SUPABASE_URL } from "@/lib/env";

let cached: SupabaseClient<Db> | null = null;

/**
 * Service-role client: BYPASSES RLS. Use only inside server code that has already
 * verified the caller's role (lib/auth.ts requireRole) or for public-by-design writes (voice).
 */
export function adminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set");
  cached ??= createClient<Db>(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return cached;
}
