import { NextResponse, type NextRequest } from "next/server";
import { audit, getSession, syncProfile } from "@/lib/auth";
import { isAllowedEmail } from "@/lib/env";
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
  const email = user?.email?.toLowerCase();

  // Domain is enforced HERE on the server, never by the `hd` hint alone. Unverified or foreign addresses are logged out at once.
  if (!user || !email || !isAllowedEmail(email) || user.email_confirmed_at == null) {
    await sb.auth.signOut();
    return NextResponse.redirect(`${origin}/login?error=domain`);
  }

  await syncProfile(user.id, email);
  const session = await getSession();
  if (session) await audit(session, "login");
  return NextResponse.redirect(`${origin}${session?.role ? "/dashboard" : "/pending-access"}`);
}
