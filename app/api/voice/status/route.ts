import { NextResponse } from "next/server";
import { guard, noStore } from "@/lib/api-guard";
import { lookupVoice } from "@/lib/voice-store";

export async function GET(req: Request) {
  const denied = guard(req);
  if (denied) return denied;
  const code = new URL(req.url).searchParams.get("code")?.trim().toUpperCase() ?? "";
  if (!/^UTD-[A-Z0-9]{6}$/.test(code)) return NextResponse.json({ error: "invalid code" }, { status: 400 });
  const rec = await lookupVoice(code);
  if (!rec) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(rec, noStore);
}
