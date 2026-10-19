"use client";

import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring } from "motion/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { IconArrowUp } from "@/components/icons/Icon";

const R = 22;

/** Appears after scrolling down; the ring around it fills with the page scroll progress. */
export function ScrollTop() {
  const t = useTranslations("common");
  const reduce = useReducedMotion();
  const [show, setShow] = useState(false);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 26 });
  useEffect(() => scrollYProgress.on("change", () => setShow(window.scrollY > 500)), [scrollYProgress]);
  return (
    <AnimatePresence>
      {show && (
        <motion.button
          type="button"
          aria-label={t("scrollTop")}
          onClick={() => window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" })}
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.8 }}
          whileHover={reduce ? undefined : { y: -3 }}
          className="fixed bottom-5 right-4 z-40 grid h-[52px] w-[52px] place-items-center rounded-full bg-brand-deep text-on-brand shadow-[0_10px_30px_-8px_rgb(5_13_36/0.6)] sm:bottom-7 sm:right-7"
        >
          <svg aria-hidden width="52" height="52" viewBox="0 0 52 52" className="absolute inset-0 -rotate-90">
            <circle cx="26" cy="26" r={R} fill="none" stroke="rgb(255 255 255 / 0.15)" strokeWidth="3" />
            <motion.circle cx="26" cy="26" r={R} fill="none" stroke="var(--c-pink)" strokeWidth="3" strokeLinecap="round" style={{ pathLength: progress }} />
          </svg>
          <IconArrowUp width={20} height={20} className="relative" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
