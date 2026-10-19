"use client";

import { motion, useReducedMotion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { LocaleSwitch } from "@/components/i18n/LocaleSwitch";
import { IconFacebook, IconInstagram } from "@/components/ui/icons";
import { Link } from "@/i18n/navigation";
import { SITE } from "@/lib/site";

/** Round logo slot. [placeholder] until the real crest / council logo files are added to /public. */
function LogoSlot({ label, text, delay, className }: { label: string; text: string; delay: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.span
      title={label}
      aria-hidden
      initial={reduce ? false : { scale: 0.3, opacity: 0, rotate: -20 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 380, damping: 16, delay }}
      className={`no-select grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white font-display text-[0.62rem] font-semibold leading-none text-brand shadow-[0_0_0_3px_rgb(255_255_255/0.15)] sm:h-11 sm:w-11 md:h-[54px] md:w-[54px] md:text-xs ${className ?? ""}`}
    >
      {text}
    </motion.span>
  );
}

const SOCIAL = [
  { label: "Facebook", href: SITE.facebook, Icon: IconFacebook },
  { label: "Instagram", href: SITE.instagram, Icon: IconInstagram },
];

export function Navbar() {
  const t = useTranslations();
  const locale = useLocale();
  return (
    <header className="relative z-30 overflow-hidden bg-gradient-to-r from-brand-deep via-[#0a1a40] to-[#0e2a66] text-on-brand shadow-[0_6px_24px_-8px_rgb(5_13_36/0.6)]">
      <span aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-pink/20 blur-3xl" />
      <nav aria-label={t("header.nav")} className="relative mx-auto flex max-w-[1320px] items-center justify-between gap-3 px-4 py-3 md:py-4">
        <Link href="/" className="flex min-w-0 items-center gap-2.5 md:gap-3" aria-label={t("header.home", { name: t("site.name") })}>
          <LogoSlot label={t("header.schoolLogoLabel")} text={t("header.schoolLogo")} delay={0.05} />
          <LogoSlot label={t("header.councilLogoLabel")} text={t("header.councilLogo")} delay={0.15} className="max-sm:hidden" />
          <span data-swap className="ml-1 min-w-0">
            <span className="line-clamp-2 block font-display text-[0.85rem] font-semibold leading-tight sm:truncate sm:text-[1.1rem] sm:leading-snug md:text-[1.35rem]">
              {t("site.name")}
            </span>
            {/* second line = the other language's name */}
            <span lang={locale === "th" ? "en" : "th"} className="hidden truncate text-[0.7rem] tracking-[0.04em] text-on-brand/60 sm:block md:text-sm">
              {locale === "th" ? t("site.nameEn") : t("hero.sub")}
            </span>
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {SOCIAL.map(({ label, href, Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="inline-flex h-9 items-center gap-2 rounded-full border border-white/20 bg-white/5 px-2.5 text-sm font-medium transition duration-300 hover:-translate-y-0.5 hover:border-pink-400/70 hover:bg-white/10 hover:shadow-glow sm:h-10 sm:px-3 md:px-4"
            >
              <Icon width={17} height={17} />
              <span className="hidden lg:inline">{label}</span>
            </a>
          ))}
          <LocaleSwitch />
        </div>
      </nav>
    </header>
  );
}
