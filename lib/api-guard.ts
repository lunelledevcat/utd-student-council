import "server-only";
import { NextResponse } from "next/server";
import { isSameOrigin, verifyToken } from "@/lib/security";

/** Data APIs require same-origin + a short-lived signed token issued by /api/token. */
export function guard(req: Request): NextResponse | null {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!verifyToken(req.headers.get("x-utd-token"))) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return null;
}

export const noStore = { headers: { "cache-control": "no-store" } };
