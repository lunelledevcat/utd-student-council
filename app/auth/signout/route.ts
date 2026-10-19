import { NextResponse, type NextRequest } from "next/server";
import { supabaseConfigured } from "@/lib/env";
import { isSameOrigin } from "@/lib/security";
import { logSecurity } from "@/lib/security-log";
import { createClient } from "@/lib/supabase/server";

/** POST only, same origin only (CSRF). Form field scope=global signs the user out on every device (revokes all sessions). */
export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return new NextResponse("Forbidden", { status: 403 });
  if (supabaseConfigured()) {
    const global = (await req.formData().catch(() => null))?.get("scope") === "global";
    const db = await createClient();
    const { data } = global ? await db.auth.getUser() : { data: { user: null } };
    await db.auth.signOut({ scope: global ? "global" : "local" });
    if (global && data.user) await logSecurity("logout_all", { userId: data.user.id });
  }
  return NextResponse.redirect(`${req.nextUrl.origin}/`, { status: 303 });
}
