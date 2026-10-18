import { NextResponse, type NextRequest } from "next/server";
import { allowedDomain, supabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/** Starts Google OAuth (PKCE). Rate-limited to 5 / 15 min per IP in proxy.ts. */
export async function GET(req: NextRequest) {
  const { origin } = req.nextUrl;
  if (!supabaseConfigured()) return NextResponse.redirect(`${origin}/login?error=config`);
  const { data, error } = await (await createClient()).auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
      // `hd` only pre-filters Google's account picker; the domain is enforced server-side in /auth/callback.
      queryParams: { hd: allowedDomain(), prompt: "select_account" },
    },
  });
  if (error || !data.url) return NextResponse.redirect(`${origin}/login?error=oauth`);
  return NextResponse.redirect(data.url);
}
