import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { VoiceView } from "@/components/sections/VoiceView";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("voiceTitle"),
    description: t("voiceDescription"),
    alternates: { canonical: `/${locale}/voice`, languages: { th: "/th/voice", en: "/en/voice" } },
  };
}

export default async function VoicePage({ params }: { params: Promise<{ locale: string }> }) {
  setRequestLocale((await params).locale);
  return <VoiceView />;
}
