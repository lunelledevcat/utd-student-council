import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Db } from "@/lib/supabase/types";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/env";

/** Anonymous client for public pages — RLS only exposes status = 'approved' rows. */
export function publicClient() {
  return createClient<Db>(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** URL of an approved image in the public bucket. */
export const publicImageUrl = (path: string) => `${SUPABASE_URL}/storage/v1/object/public/public/${path}`;
