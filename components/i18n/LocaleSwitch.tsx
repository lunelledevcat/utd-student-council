"use client";

import { motion, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { useLocaleSwitch } from "@/components/i18n/LocaleProvider";
import { routing, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/** "TH | EN" pill; the pink highlight springs to the chosen language. */
export function LocaleSwitch({ className }: { className?: string }) {
  const t = useTranslations("header");
  const reduce = useReducedMotion();
  const { locale, switchLocale, switching } = useLocaleSwitch();
  const idx = routing.locales.indexOf(locale);
  return (
    <div
      role="radiogroup"
      aria-label={t("language")}
      aria-busy={switching}
      className={cn("relative grid grid-cols-2 rounded-full border border-white/20 bg-white/5 p-0.5", className ?? "h-9 sm:h-10")}
    >
      <motion.span
        aria-hidden
        className="absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded-full bg-gradient-to-r from-pink to-pink-400 shadow-glow"
        initial={false}
        animate={{ x: `${idx * 100}%` }}
        transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 32 }}
      />
      {routing.locales.map((l: Locale) => (
        <button
          key={l}
          type="button"
          role="radio"
          aria-checked={l === locale}
          aria-label={t(l === "th" ? "thName" : "enName")}
          lang={l}
          onClick={() => switchLocale(l)}
          className={cn(
            "relative z-10 min-w-9 rounded-full px-2.5 font-display text-[0.8rem] font-semibold tracking-wide transition-colors sm:px-3",
            l === locale ? "text-white" : "text-on-brand/70 hover:text-white",
          )}
        >
          {t(l)}
        </button>
      ))}
    </div>
  );
}
