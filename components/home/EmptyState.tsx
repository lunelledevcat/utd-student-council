"use client";

import { motion, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { IconReset } from "@/components/ui/icons";

/** Friendly "nothing here" box: a Kae Farang blossom holding a magnifier, bobbing gently. */
export function EmptyState({ query, onClear, kind }: { query?: string; onClear?: () => void; kind: "news" | "policy" | "council" | "advisor" }) {
  const t = useTranslations("empty");
  const reduce = useReducedMotion();
  const searching = !!query;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      data-swap
      className="col-span-full mx-auto flex max-w-md flex-col items-center rounded-[20px] border border-dashed border-line bg-surface/70 px-6 py-10 text-center"
    >
      <motion.svg
        width="120"
        height="110"
        viewBox="0 0 120 110"
        aria-hidden
        animate={reduce ? undefined : { y: [0, -6, 0], rotate: [0, -3, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      >
        {[0, 72, 144, 216, 288].map((r) => (
          <ellipse key={r} cx="52" cy="30" rx="13" ry="20" fill="var(--c-pink-400)" opacity="0.85" transform={`rotate(${r} 52 52)`} />
        ))}
        <circle cx="52" cy="52" r="15" fill="var(--c-gold)" />
        <circle cx="47" cy="50" r="2" fill="var(--c-brand-deep)" />
        <circle cx="57" cy="50" r="2" fill="var(--c-brand-deep)" />
        <path d={searching ? "M47 58q5-3 10 0" : "M47 57q5 4 10 0"} stroke="var(--c-brand-deep)" strokeWidth="2" fill="none" strokeLinecap="round" />
        <circle cx="90" cy="74" r="13" fill="none" stroke="var(--c-brand-mid)" strokeWidth="5" />
        <path d="m99 84 13 13" stroke="var(--c-brand-mid)" strokeWidth="7" strokeLinecap="round" />
      </motion.svg>
      <p className="mt-3 font-display text-lg font-semibold text-strong">{searching ? t("notFound") : t(kind)}</p>
      <p className="mt-1 text-sm text-muted">
        {searching ? t("noResults", { q: query }) : t("forYear")}
      </p>
      {searching && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 font-display font-medium text-on-brand transition hover:-translate-y-0.5 hover:shadow-lift"
        >
          <IconReset width={18} height={18} /> {t("clear")}
        </button>
      )}
    </motion.div>
  );
}
