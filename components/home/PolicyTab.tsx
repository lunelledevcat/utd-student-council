"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ViewTransition } from "react";
import type { Policy } from "@/lib/content";
import { EmptyState } from "@/components/home/EmptyState";
import { CardItem, ZoneTitle } from "@/components/home/parts";
import { WideCard } from "@/components/home/NewsTab";
import { IconChevronRight, IconFlag } from "@/components/ui/icons";
import { StatusPill } from "@/components/ui/StatusPill";

export function PolicyTab({ policies, query, onClear }: { policies: Policy[]; query: string; onClear: () => void }) {
  if (policies.length === 0) return <ul className="grid"><EmptyState query={query} onClear={onClear} what="นโยบาย" /></ul>;
  return (
    <section aria-labelledby="pol-h">
      <ZoneTitle icon={<IconFlag width={18} height={18} />} count={policies.length}><span id="pol-h">นโยบายสภานักเรียน</span></ZoneTitle>
      <ul className="grid gap-6">
        <AnimatePresence mode="popLayout">
          {policies.map((p, i) => (
            <CardItem key={p.id} index={i}>
              <Link href={`/policies/${p.slug}`} className="block rounded-[20px]" aria-label={`${p.title} — ดูรายละเอียดนโยบาย`}>
                <WideCard
                  photos={p.cover ? [p.cover] : p.photos.slice(0, 1)}
                  alt={p.title}
                  imageWrap={(img) => (
                    <ViewTransition name={`policy-${p.slug}`} share="morph" default="none">
                      {img}
                    </ViewTransition>
                  )}
                  caption={
                    <>
                      <StatusPill status={p.status} />
                      <span className="font-display font-medium text-strong">{p.title}</span>
                      <span className="inline-flex items-center text-sm text-pink transition-transform group-hover:translate-x-1">
                        ดูรายละเอียด <IconChevronRight width={16} height={16} />
                      </span>
                    </>
                  }
                  footer={
                    <div className="h-1.5 w-full bg-surface-2" aria-hidden>
                      <motion.div
                        className="h-full rounded-r-full bg-gradient-to-r from-brand-mid via-pink to-pink-400"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${p.progress}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                      />
                    </div>
                  }
                />
              </Link>
            </CardItem>
          ))}
        </AnimatePresence>
      </ul>
    </section>
  );
}
