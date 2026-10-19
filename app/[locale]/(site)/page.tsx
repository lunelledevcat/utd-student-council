import { setRequestLocale } from "next-intl/server";
import { HomeTabs } from "@/components/home/HomeTabs";
import { Hero } from "@/components/sections/Hero";
import { getYearContent } from "@/lib/content";
import { DEFAULT_TAB, isTab } from "@/lib/search";

// Single page (reference layout): banner, sticky year/search/tab bar, tab content with popups.
// ?tab= and ?year= make every view shareable; unknown values fall back to the defaults.
export default async function HomePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string; year?: string }>;
}) {
  const [{ locale }, sp] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);
  const content = await getYearContent(Number(sp.year) || undefined);
  return (
    <>
      <Hero />
      <HomeTabs content={content} initialTab={isTab(sp.tab) ? sp.tab : DEFAULT_TAB} />
    </>
  );
}
