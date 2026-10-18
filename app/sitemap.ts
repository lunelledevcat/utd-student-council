import type { MetadataRoute } from "next";
import { getPolicySlugs } from "@/lib/content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return [
    { url: base },
    ...["policy", "council", "advisor"].map((t) => ({ url: `${base}/?tab=${t}` })),
    ...(await getPolicySlugs()).map((s) => ({ url: `${base}/policies/${s}` })),
    { url: `${base}/voice` },
  ];
}
