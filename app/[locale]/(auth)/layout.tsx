import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LocaleSwitch } from "@/components/i18n/LocaleSwitch";
import { Petals } from "@/components/ui/Petals";
import { Link } from "@/i18n/navigation";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations();
  return (
    <main className="relative isolate grid min-h-dvh place-items-center overflow-hidden bg-gradient-to-br from-brand-deep via-brand to-brand-mid px-4 py-10 text-on-brand">
      <Petals />
      <div className="absolute right-4 top-4"><LocaleSwitch /></div>
      <div className="relative w-full max-w-md space-y-6 rounded-[24px] border border-white/15 bg-surface p-8 text-ink shadow-soft">
        <Link href="/" className="flex items-center gap-3" aria-label={t("auth.back")}>
          <span className="no-select grid h-11 w-11 place-items-center rounded-full bg-gold font-display text-[0.65rem] font-semibold text-brand-deep" title={t("header.councilLogoLabel")}>
            {t("header.councilLogo")}
          </span>
          <span className="font-display text-lg font-semibold text-strong">{t("site.name")}</span>
        </Link>
        {children}
      </div>
    </main>
  );
}
