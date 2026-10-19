import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { signOut } from "@/lib/authjs";
import { signOutEverywhere } from "@/lib/data/admin";
import { getDb } from "@/lib/db";
import { isSameOrigin } from "@/lib/security";
import { logSecurity } from "@/lib/security-log";

/** POST only, same origin only (CSRF). Form field scope=global ends every session of the account (all devices). */
export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return new NextResponse("Forbidden", { status: 403 });
  const global = (await req.formData().catch(() => null))?.get("scope") === "global";
  if (global) {
    const s = await getSession();
    if (s) {
      await signOutEverywhere(getDb(), s.id);
      await logSecurity("logout_all", { userId: s.id });
    }
  }
  await signOut({ redirect: false });
  return NextResponse.redirect(`${req.nextUrl.origin}/`, { status: 303 });
}
