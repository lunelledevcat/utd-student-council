import { siteUrl } from "@/lib/env";
import type { MetadataRoute } from "next";
import { AI_CRAWLERS } from "@/lib/bots";

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: [
      { userAgent: [...AI_CRAWLERS], disallow: "/" },
      { userAgent: "*", allow: "/", disallow: ["/api/", "/auth/", "/_hp/", ...["", "/th", "/en"].flatMap((l) => [`${l}/dashboard`, `${l}/admin`, `${l}/login`, `${l}/pending-access`])] },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}

// read at request time: D1 (sitemap) and the runtime SITE_URL var are not available at build time
export const dynamic = "force-dynamic";
