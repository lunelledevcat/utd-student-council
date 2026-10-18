"use client";

import { motion, useReducedMotion } from "motion/react";
import { IconCalendar } from "@/components/ui/icons";
import { cn, thaiDate } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Grid/list item: enters the screen with a 60 ms stagger, re-flows smoothly when filters change (layout). */
export function CardItem({ index, children, className }: { index: number; children: React.ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.li
      layout={reduce ? false : "position"}
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 26, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.2 } }}
      viewport={{ once: true, margin: "0px 0px -40px 0px" }}
      transition={{ duration: 0.5, ease: EASE, delay: reduce ? 0 : Math.min(index, 12) * 0.06 }}
    >
      {children}
    </motion.li>
  );
}

export function ZoneTitle({ icon, children, count }: { icon: React.ReactNode; children: React.ReactNode; count?: number }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <h2 className="flex items-center gap-2.5 text-[1.15rem] font-semibold text-strong md:text-[1.35rem]">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-pink to-pink-400 text-white shadow-[0_6px_16px_-6px_var(--c-pink)]">{icon}</span>
        {children}
      </h2>
      {count !== undefined && <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-muted">{count}</span>}
      <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-line to-transparent" />
    </div>
  );
}

export function DateChip({ iso, className }: { iso: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[0.8rem] font-medium text-pink", className)}>
      <IconCalendar width={14} height={14} />
      <time dateTime={iso}>{thaiDate(iso)}</time>
    </span>
  );
}

/** Paragraphs of user text (plain text only — never HTML). */
export function Prose({ paragraphs, className }: { paragraphs: string[]; className?: string }) {
  return (
    <div className={cn("space-y-4 text-[0.98rem] leading-[1.9] text-ink/90", className)}>
      {paragraphs.map((p, i) => <p key={i} className="whitespace-pre-line">{p}</p>)}
    </div>
  );
}
