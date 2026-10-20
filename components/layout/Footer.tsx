"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/components/icons/Icon";
import { Link } from "@/i18n/navigation";
import { SCHOOL_INFO } from "@/lib/school-info";

/**
 * Footer on every public page: council emblem (left) + school address, phone, fax and affiliation (right; stacked on
 * phones), links, copyright and a small creator credit. Every image has fixed dimensions (no layout shift).
 * Wording: messages footer.school; numbers: lib/school-info.ts.
 */
export function Footer() {
  const t = useTranslations();
  const affiliations = t.raw("footer.school.affiliations") as string[];
  return (
    <footer className="relative mt-14 overflow-hidden bg-gradient-to-br from-brand-deep via-[#0a1a40] to-[#0e2a66] text-on-brand">
      <span aria-hidden className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-pink to-transparent" />
      <span aria-hidden className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-pink/15 blur-3xl" />
      <div data-swap className="relative mx-auto max-w-[1320px] px-4 pb-24 pt-9 text-[0.88rem] md:pb-9">
        <div className="flex flex-col items-center gap-5 text-center md:flex-row md:items-start md:gap-7 md:text-left">
          <picture className="shrink-0">
            <source type="image/avif" srcSet="/brand/logo-council-128.avif 1x, /brand/logo-council-256.avif 2x" />
            <img src="/brand/logo-council-128.png" srcSet="/brand/logo-council-128.webp 1x, /brand/logo-council-256.webp 2x" alt={t("footer.school.logoAlt")} width={88} height={88} className="h-[88px] w-[88px] object-contain" loading="lazy" decoding="async" />
          </picture>
          <div className="min-w-0 space-y-3">
            <p className="font-display text-lg font-semibold leading-snug">{t("footer.school.council")}</p>
            <ul className="space-y-2 text-on-brand/80">
              <li className="flex items-start justify-center gap-2 md:justify-start">
                <Icon name="mapPin" size={18} className="mt-0.5 shrink-0 text-white" />
                <span>{t("footer.school.address")}</span>
              </li>
              <li className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 md:justify-start">
                <span className="inline-flex items-center gap-2">
                  <Icon name="phone" size={18} className="shrink-0 text-white" />
                  <span>{t("footer.school.phone")}</span>
                  <a href={`tel:${SCHOOL_INFO.phone.tel}`} aria-label={t("footer.school.callLabel", { number: SCHOOL_INFO.phone.display })} className="font-semibold text-white underline-offset-4 hover:text-pink-400 hover:underline">
                    {SCHOOL_INFO.phone.display}
                  </a>
                </span>
                <span className="inline-flex items-center gap-2">
                  <Icon name="fax" size={18} className="shrink-0 text-white" />
                  <span>{t("footer.school.fax")} {SCHOOL_INFO.fax.display}</span>
                </span>
              </li>
              <li className="flex items-start justify-center gap-2 md:justify-start">
                <Icon name="buildings" size={18} className="mt-0.5 shrink-0 text-white" />
                <span>
                  <span className="sr-only">{t("footer.school.affiliation")}: </span>
                  {affiliations.map((a, i) => <span key={i} className="block">{a}</span>)}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-7 flex flex-col items-center gap-3 border-t border-white/10 pt-5 text-center text-on-brand/70">
          <p className="flex flex-wrap justify-center gap-x-4 gap-y-1">
            <Link href="/voice" className="hover:text-pink-400">{t("footer.voice")}</Link>
            <Link href="/login" className="hover:text-pink-400">{t("footer.login")}</Link>
          </p>
          <p className="text-xs">{t("footer.copyright", { school: t("site.school") })}</p>
          {/* creator credit: small capsule, gentle lift on hover (none with reduced motion) */}
          <p className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 py-1 pl-1 pr-3 text-[0.72rem] text-on-brand/75 transition duration-300 motion-safe:hover:-translate-y-0.5 hover:border-pink-400/50 hover:text-on-brand">
            <picture className="shrink-0">
              <source type="image/avif" srcSet="/credits/lunelle-96.avif 1x, /credits/lunelle-192.avif 2x" />
              <img src="/credits/lunelle-96.webp" srcSet="/credits/lunelle-96.webp 1x, /credits/lunelle-192.webp 2x" alt={t("footer.school.creditAlt")} width={24} height={24} className="h-6 w-6 rounded-full bg-white object-cover transition duration-300 motion-safe:group-hover:rotate-6" loading="lazy" decoding="async" />
            </picture>
            <span lang="en">{t("footer.school.credit")}</span>
          </p>
        </div>
        {/* honeypot: invisible to people, followed by scrapers -> proxy.ts bans the IP for 1h (disallowed in robots.txt) */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- must stay a plain link (no prefetch): proxy.ts bans whoever follows it */}
        <a href="/_hp/directory" rel="nofollow noindex" tabIndex={-1} aria-hidden style={{ display: "none" }}>{t("footer.honeypot")}</a>
      </div>
    </footer>
  );
}
