import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getPolicySlugs } from "@/lib/content";

/** Every public page in both languages, each entry listing its alternates (hreflang). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const paths = ["", "?tab=policy", "?tab=council", "?tab=advisor", "/voice", ...(await getPolicySlugs()).map((s) => `/policies/${s}`)];
  const at = (l: string, p: string) => `${base}/${l}${p}`;
  return paths.flatMap((p) =>
    routing.locales.map((l) => ({
      url: at(l, p),
      alternates: { languages: Object.fromEntries(routing.locales.map((x) => [x, at(x, p)])) },
    })),
  );
}
