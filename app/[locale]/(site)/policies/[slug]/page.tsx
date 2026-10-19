import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { PolicyView } from "@/components/policy/PolicyView";
import { getPolicyBySlug, getYears } from "@/lib/content";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const p = await getPolicyBySlug(slug);
  if (!p) return { title: (await getTranslations({ locale, namespace: "meta" }))("policyNotFound") };
  const en = locale === "en";
  return {
    title: (en && p.title.en) || p.title.th,
    description: (en && p.summary.en) || p.summary.th,
    alternates: { canonical: `/${locale}/policies/${slug}`, languages: { th: `/th/policies/${slug}`, en: `/en/policies/${slug}` } },
  };
}

/** Full policy page (opened from tab ②). Both languages are sent so the language switch works in place. */
export default async function PolicyPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const [p, { current }] = await Promise.all([getPolicyBySlug(slug), getYears()]);
  if (!p) notFound();
  return <PolicyView p={p} currentYear={current} />;
}
