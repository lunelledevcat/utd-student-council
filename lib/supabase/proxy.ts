import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/env";

/**
 * Refreshes the Supabase session cookies on `res` and returns the verified user (or null).
 * getUser() asks the Auth server to validate the JWT — never trust the cookie alone.
 */
export async function refreshSession(req: NextRequest, res: NextResponse) {
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list) => list.forEach(({ name, value, options }) => res.cookies.set(name, value, options)),
    },
  });
  const { data } = await supabase.auth.getUser();
  return data.user;
}
