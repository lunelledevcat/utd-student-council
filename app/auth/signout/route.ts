import { NextResponse, type NextRequest } from "next/server";
import { supabaseConfigured } from "@/lib/env";
import { isSameOrigin } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return new NextResponse("Forbidden", { status: 403 });
  if (supabaseConfigured()) await (await createClient()).auth.signOut();
  return NextResponse.redirect(`${req.nextUrl.origin}/`, { status: 303 });
}
