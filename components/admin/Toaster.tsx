"use client";

import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { dismiss, useToasts } from "@/components/admin/live";
import { IconClose } from "@/components/icons/Icon";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function Toaster() {
  const t = useTranslations("common");
  const items = useToasts();
  return (
    <div aria-live="polite" className="pointer-events-none fixed bottom-24 right-4 z-[120] flex w-[min(92vw,360px)] flex-col gap-2 sm:bottom-6">
      <AnimatePresence initial={false}>
        {items.map((i) => (
          <motion.div
            key={i.key}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40 }}
            role={i.tone === "error" ? "alert" : "status"}
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-[0_18px_40px_-18px_rgb(11_31_77/0.5)]",
              i.tone === "ok" && "border-done/30 bg-white text-ink",
              i.tone === "error" && "border-danger/30 bg-white text-danger",
              i.tone === "info" && "border-line bg-white text-ink",
            )}
          >
            <span aria-hidden className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", i.tone === "ok" ? "bg-done" : i.tone === "error" ? "bg-danger" : "bg-brand-mid")} />
            <div className="min-w-0 flex-1">
              <p>{i.text}</p>
              {i.action && <Link href={i.action.href} onClick={() => dismiss(i.key)} className="mt-1 inline-block font-semibold text-pink-ink underline-offset-4 hover:underline">{i.action.label}</Link>}
            </div>
            <button type="button" onClick={() => dismiss(i.key)} aria-label={t("close")} className="text-muted hover:text-ink"><IconClose width={14} /></button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
