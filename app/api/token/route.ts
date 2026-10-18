import { NextResponse } from "next/server";
import { noStore } from "@/lib/api-guard";
import { isSameOrigin, issueToken } from "@/lib/security";

export function GET(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  return NextResponse.json(issueToken(300), noStore);
}
