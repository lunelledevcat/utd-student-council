import { NextResponse, type NextRequest } from "next/server";
import { audit, googleVerified, resolveAccess, syncProfile } from "@/lib/auth";
import { normalizeEmail } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const { origin, searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  if (!code) return NextResponse.redirect(`${origin}/login?error=oauth`);

  const sb = await createClient();
  const { error } = await sb.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(`${origin}/login?error=oauth`);

  const { data } = await sb.auth.getUser();
  const user = data.user;
  const email = normalizeEmail(user?.email);

  // Enforced HERE on the server (lib/env.ts decideAccess): Google-verified address that is in ADMIN_EMAILS, an active
  // allowed_users row, or on the school domain (no role yet -> /pending-access). Anything else is logged out at once.
  const access = user && email && user.email_confirmed_at != null ? await resolveAccess(user.id, email, googleVerified(user)) : "denied";
  if (!user || access === "denied") {
    await sb.auth.signOut();
    return NextResponse.redirect(`${origin}/login?error=domain`);
  }

  await syncProfile(user.id, email);
  // ip hash + user agent are added by audit() (shared accounts are used by several people)
  await audit({ id: user.id, email }, "login", undefined, undefined, { access });
  return NextResponse.redirect(`${origin}${access === "pending" ? "/pending-access" : "/dashboard"}`);
}
