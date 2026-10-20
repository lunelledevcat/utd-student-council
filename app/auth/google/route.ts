import { NextResponse } from "next/server";
import { supabaseConfigured } from "@/lib/env";
import { SITE_URL } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

/** Starts Google OAuth (PKCE). Rate-limited (authStart) in proxy.ts. */
export async function GET() {
  const origin = SITE_URL; // never the request's Host (proxy.ts moves other hosts here first)
  if (!supabaseConfigured()) return NextResponse.redirect(`${origin}/login?error=config`);
  const { data, error } = await (await createClient()).auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
      // No `hd` hint: it would hide non-school accounts, and ADMIN_EMAILS may be outside the domain.
      // Who may sign in is enforced server-side in /auth/callback (lib/env.ts decideAccess).
      queryParams: { prompt: "select_account" },
    },
  });
  if (error || !data.url) return NextResponse.redirect(`${origin}/login?error=oauth`);
  return NextResponse.redirect(data.url);
}
