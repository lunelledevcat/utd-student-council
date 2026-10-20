import { setRequestLocale } from "next-intl/server";
import { HomeTabs } from "@/components/home/HomeTabs";
import { Hero } from "@/components/sections/Hero";
import { getYearContent } from "@/lib/content";
import { DEFAULT_TAB, isTab } from "@/lib/search";

/**
 * The single public page (banner, year/search/tab bar, tab content). Rendered statically and refreshed every 10 min
 * (ISR); reads no cookies or headers. `?year=` / `?tab=` views are rewritten by proxy.ts to /[locale]/home/[year]/[tab]
 * so each one is its own cached page and opens on the right tab without a flash.
 */
export async function HomeView({ locale, year, tab }: { locale: string; year?: number; tab?: string }) {
  setRequestLocale(locale);
  const content = await getYearContent(year);
  return (
    <>
      <Hero />
      <HomeTabs content={content} initialTab={isTab(tab) ? tab : DEFAULT_TAB} />
    </>
  );
}
