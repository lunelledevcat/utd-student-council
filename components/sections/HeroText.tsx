"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { ceYear, cn, words } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * One headline line. On first load the words rise in one by one; when the language changes the old words slide up
 * out of a clipping mask and the new ones slide up in (Thai split with Intl.Segmenter). Reduced motion: fade only.
 */
function SwapLine({ text, delay = 0, className }: { text: string; delay?: number; className?: string }) {
  const locale = useLocale();
  const reduce = useReducedMotion();
  const parts = words(text, locale);
  return (
    <span className={cn("relative block overflow-hidden pb-[0.12em]", className)} aria-label={text}>
      <AnimatePresence mode="popLayout" initial={true}>
        <motion.span key={`${locale}:${text}`} className="block" aria-hidden>
          {parts.map((w, i) =>
            w.trim() === "" ? (
              <span key={i}>{w}</span>
            ) : (
              <motion.span
                key={i}
                className="inline-block"
                initial={reduce ? { opacity: 0 } : { y: "105%", opacity: 0 }}
                animate={{ y: 0, opacity: 1, transition: { duration: 0.55, ease: EASE, delay: delay + i * 0.06 } }}
                exit={reduce ? { opacity: 0 } : { y: "-105%", opacity: 0, transition: { duration: 0.3, ease: "easeIn", delay: i * 0.03 } }}
              >
                {w}
              </motion.span>
            ),
          )}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export function HeroText({ year }: { year: number }) {
  const t = useTranslations();
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 max-w-[760px] space-y-2 p-5 pb-11 md:inset-y-0 md:flex md:flex-col md:justify-center md:space-y-3 md:px-20 md:py-12">
      <p data-swap className="w-fit rounded-full border border-gold/70 bg-brand-deep/35 px-3.5 py-0.5 text-sm font-medium text-gold backdrop-blur">
        {t("year.badge", { be: year, ce: ceYear(year) })}
      </p>
      <h1 className="text-[1.65rem] font-bold leading-tight drop-shadow-[0_2px_12px_rgb(5_13_36/0.6)] sm:text-[2.2rem] lg:text-[2.9rem]">
        <SwapLine text={t("hero.line1")} delay={0.15} />
        <SwapLine text={t("hero.line2")} delay={0.45} className="text-pink-400" />
      </h1>
      <p data-swap className="text-sm tracking-[0.06em] text-on-brand/80 md:text-base">{t("hero.sub")}</p>
    </div>
  );
}
