import type { MetadataRoute } from "next";
import { getEvents, getNews } from "@/lib/content";
import { NAV } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return [
    ...NAV.map((n) => ({ url: base + (n.href === "/" ? "" : n.href) })),
    { url: `${base}/documents` },
    ...getNews().map((n) => ({ url: `${base}/news/${n.slug}`, lastModified: n.date })),
    ...getEvents().map((e) => ({ url: `${base}/events/${e.slug}`, lastModified: e.date })),
  ];
}
