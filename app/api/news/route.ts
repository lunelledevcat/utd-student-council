import { NextResponse } from "next/server";
import { guard, noStore } from "@/lib/api-guard";
import { getNews } from "@/lib/content";
import { paginate } from "@/lib/pagination";

export async function GET(req: Request) {
  const denied = guard(req);
  if (denied) return denied;
  const url = new URL(req.url);
  const r = paginate(await getNews(), Number(url.searchParams.get("page")), Number(url.searchParams.get("size") ?? 10));
  // list view: no full body
  return NextResponse.json({ ...r, items: r.items.map(({ slug, title, tag, date, excerpt }) => ({ slug, title, tag, date, excerpt })) }, noStore);
}
