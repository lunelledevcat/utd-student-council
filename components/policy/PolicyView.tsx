"use client";

import { useLocale, useTranslations } from "next-intl";
import { ViewTransition } from "react";
import type { Policy } from "@/lib/content";
import { Prose } from "@/components/home/parts";
import { ThBadge, Tx, useL } from "@/components/i18n/LocaleProvider";
import { PolicyProgress, PolicyTimeline } from "@/components/policy/PolicyMotion";
import { Gallery } from "@/components/ui/Gallery";
import { SmartImage } from "@/components/ui/SmartImage";
import { StatusPill } from "@/components/ui/StatusPill";
import { IconArrowLeft, IconImages, IconUsers } from "@/components/ui/icons";
import { Link } from "@/i18n/navigation";
import { homeHref } from "@/lib/search";

/** The card image morphs into this hero (React <ViewTransition>). */
export function PolicyView({ p, currentYear }: { p: Policy & { year: number }; currentYear: number }) {
  const t = useTranslations("policy");
  const locale = useLocale();
  const pick = useL();
  const cover = p.cover ?? p.photos[0] ?? null;
  const body = pick(p.body);
  // homeHref includes the locale; the next-intl Link wants it without
  const back = homeHref(locale, "policy", p.year, currentYear).replace(`/${locale}`, "") || "/";

  return (
    <article className="mx-auto max-w-[1100px] px-4 pb-6 pt-5 md:pt-8">
      <Link
        href={back}
        data-swap
        className="group mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-ink shadow-soft transition hover:-translate-y-0.5 hover:border-pink hover:text-pink"
      >
        <IconArrowLeft width={16} height={16} className="transition-transform group-hover:-translate-x-1" /> {t("back")}
      </Link>

      <ViewTransition name={`policy-${p.slug}`} share="morph" default="none">
        <div className="relative overflow-hidden rounded-[24px] shadow-soft">
          {cover ? (
            <SmartImage img={cover} alt={pick(p.title).value} sizes="(max-width: 1100px) 100vw, 1100px" className="aspect-[16/9] w-full sm:aspect-[16/6]" priority />
          ) : (
            <div aria-hidden className="aspect-[16/9] w-full bg-gradient-to-br from-brand-deep via-brand to-brand-mid sm:aspect-[16/5]">
              <div className="h-full w-full bg-[radial-gradient(60%_90%_at_85%_15%,rgb(242_122_168/0.35),transparent_60%)]" />
            </div>
          )}
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-deep/85 via-brand-deep/15 to-transparent" />
          <div data-swap className="absolute inset-x-0 bottom-0 space-y-2 p-5 text-on-brand md:p-8">
            <StatusPill status={p.status} className="bg-white/95" />
            <h1 className="text-2xl font-bold leading-tight drop-shadow md:text-4xl"><Tx v={p.title} /></h1>
          </div>
        </div>
      </ViewTransition>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          {p.summary.th && <p data-swap className="text-lg font-medium text-strong"><Tx v={p.summary} /></p>}
          <section data-swap aria-label={t("detailsAria")} className="rounded-[20px] border border-line bg-surface p-5 shadow-soft md:p-7">
            {body.fallback && body.value.length > 0 && <ThBadge className="mb-2 ml-0" />}
            <Prose paragraphs={body.value.length ? body.value : [t("bodyMissing")]} />
          </section>
          <section aria-labelledby="gal-h">
            <h2 data-swap id="gal-h" className="mb-3 flex items-center gap-2 text-lg font-semibold text-strong">
              <IconImages width={18} height={18} /> {t("gallery")}
            </h2>
            {p.photos.length ? (
              <Gallery photos={p.photos} alt={pick(p.title).value} />
            ) : (
              <p data-swap className="rounded-[20px] border border-dashed border-line p-6 text-center text-sm text-muted">{t("galleryMissing")}</p>
            )}
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          <section data-swap className="rounded-[20px] border border-line bg-surface p-5 shadow-soft">
            <h2 className="mb-3 text-base font-semibold text-strong">{t("progress")}</h2>
            <PolicyProgress value={p.progress} status={p.status} />
          </section>
          <section data-swap className="rounded-[20px] border border-line bg-surface p-5 shadow-soft">
            <h2 className="mb-2 flex items-center gap-2 text-base font-semibold text-strong">
              <IconUsers width={17} height={17} /> {t("owner")}
            </h2>
            <p className="text-ink">{p.owner.th ? <Tx v={p.owner} /> : t("ownerMissing")}</p>
          </section>
          <section data-swap className="rounded-[20px] border border-line bg-surface p-5 shadow-soft">
            <h2 className="mb-4 text-base font-semibold text-strong">{t("timeline")}</h2>
            {p.timeline.length ? <PolicyTimeline steps={p.timeline} /> : <p className="text-sm text-muted">{t("timelineMissing")}</p>}
          </section>
        </aside>
      </div>
    </article>
  );
}
