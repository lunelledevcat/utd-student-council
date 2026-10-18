import type { MetadataRoute } from "next";
import { AI_CRAWLERS } from "@/lib/bots";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return {
    rules: [
      { userAgent: [...AI_CRAWLERS], disallow: "/" },
      { userAgent: "*", allow: "/", disallow: ["/api/", "/dashboard/", "/admin/", "/login", "/auth/", "/pending-access", "/_hp/"] },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
