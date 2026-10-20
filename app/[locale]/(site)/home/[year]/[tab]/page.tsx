import type { Metadata } from "next";
import { HomeView } from "../../../home-view";

// /th?year=2568&tab=policy is served from here (rewrite in proxy.ts); each combination is rendered once and cached.
export const revalidate = 600;
export const generateStaticParams = () => [];

type Props = { params: Promise<{ locale: string; year: string; tab: string }> };

/** Same canonical as the home page: these are views of it, not separate pages. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return { alternates: { canonical: `/${locale}` } };
}

export default async function HomeVariant({ params }: Props) {
  const { locale, year, tab } = await params;
  return <HomeView locale={locale} year={/^\d{4}$/.test(year) ? Number(year) : undefined} tab={tab} />;
}
