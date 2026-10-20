"use client";

import { AnimatePresence, motion, useReducedMotion, type PanInfo } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import type { Photo } from "@/lib/content";
import { IconChevronLeft, IconChevronRight } from "@/components/icons/Icon";
import { cn } from "@/lib/utils";

const INTERVAL = 6000;
const SWIPE = 60;
// Ken Burns: each slide drifts toward a different corner
const ORIGINS = ["20% 30%", "80% 25%", "70% 80%", "25% 75%"];

/**
 * Full-frame hero slider: Ken Burns + 1.2 s crossfade, auto-advance 6 s (paused on hover, focus and drag),
 * mouse drag / touch swipe, ←/→ keys, glass arrows (hover on desktop, always on phones), pill dots bottom-centre.
 * Renders the rounded banner frame; `children` (navy overlay + headline) sit between the photos and the controls.
 * No photos -> one navy gradient slide, no controls.
 */
export function HeroSlides({ photos, children }: { photos: Photo[]; children: React.ReactNode }) {
  const t = useTranslations("hero");
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const [hover, setHover] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [focused, setFocused] = useState(false);
  const n = photos.length;
  const paused = hover || dragging || focused;

  useEffect(() => {
    if (paused || n < 2) return;
    const id = setTimeout(() => setI((x) => (x + 1) % n), INTERVAL);
    return () => clearTimeout(id);
  }, [i, paused, n]);

  const go = (d: number) => setI((x) => (x + d + n) % n);
  const onDragEnd = (_: unknown, info: PanInfo) => {
    setDragging(false);
    if (info.offset.x < -SWIPE || info.velocity.x < -400) go(1);
    else if (info.offset.x > SWIPE || info.velocity.x > 400) go(-1);
  };
  const p = photos[i];
  const locale = useLocale();
  const alt = p ? (p.alt ? (locale === "en" && p.alt.en ? p.alt.en : p.alt.th) : p.caption || t("alt")) : "";

  return (
    <>
    <section
      aria-label={t("label")}
      className="relative isolate aspect-[4/3] overflow-hidden rounded-[20px] bg-gradient-to-br from-brand-deep via-[#0b1f4d] to-brand-mid text-on-brand shadow-soft sm:aspect-[16/7]"
    >
    <div
      className="group absolute inset-0 outline-none"
      role={n > 1 ? "region" : undefined}
      aria-roledescription={n > 1 ? t("roledesc") : undefined}
      aria-label={n > 1 ? t("region", { i: i + 1, n }) : undefined}
      tabIndex={n > 1 ? 0 : undefined}
      onPointerEnter={(e) => e.pointerType === "mouse" && setHover(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setHover(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setFocused(false)}
      onKeyDown={(e) => {
        if (n < 2) return;
        if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
        if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
      }}
    >
      {n === 0 ? (
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(70%_90%_at_85%_20%,rgb(242_122_168/0.35),transparent_60%),radial-gradient(60%_80%_at_70%_100%,rgb(29_59_139/0.9),transparent_70%)]" />
      ) : (
        <motion.div
          className="absolute inset-0 cursor-grab touch-pan-y active:cursor-grabbing"
          drag={n > 1 ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          dragMomentum={false}
          onDragStart={() => setDragging(true)}
          onDragEnd={onDragEnd}
        >
          <AnimatePresence initial={false}>
            <motion.div
              key={p.id}
              className="pointer-events-none absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduce ? 0.3 : 1.2 }}
            >
              {/* council banner (plain): fills the frame (cropped around its focal point), no zoom, nothing drawn over it */}
              <picture className="contents">
                {p.avifSet && <source type="image/avif" srcSet={p.avifSet} sizes="(max-width: 1320px) 100vw, 1320px" />}
                <motion.img
                  src={p.src}
                  srcSet={p.srcSet}
                  sizes="(max-width: 1320px) 100vw, 1320px"
                  alt={alt}
                  width={p.w}
                  height={p.h}
                  draggable={false}
                  fetchPriority={i === 0 ? "high" : "auto"}
                  className="no-select absolute inset-0 h-full w-full object-cover"
                  style={{ objectPosition: p.focal ?? "50% 50%", transformOrigin: ORIGINS[i % ORIGINS.length], backgroundImage: p.blur ? `url(${p.blur})` : undefined, backgroundSize: "cover" }}
                  initial={{ scale: 1 }}
                  animate={{ scale: reduce || p.plain ? 1 : 1.08 }}
                  transition={{ scale: { duration: (INTERVAL + 1200) / 1000, ease: "linear" } }}
                />
              </picture>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}

      {!p?.plain && children}

      {p?.credit && !p.plain && (
        <span className="pointer-events-none absolute right-3 top-3 z-20 rounded-full bg-black/35 px-2.5 py-0.5 text-[0.68rem] text-white/85 backdrop-blur-sm md:right-4 md:top-4">
          {t(`credit.${p.credit}`)}
        </span>
      )}

      {n > 1 && (
        <>
          {(["left", "right"] as const).map((side) => {
            const Icon = side === "left" ? IconChevronLeft : IconChevronRight;
            return (
              <button
                key={side}
                type="button"
                tabIndex={-1}
                aria-label={t(side === "left" ? "prev" : "next")}
                onClick={() => go(side === "left" ? -1 : 1)}
                className={cn(
                  "absolute bottom-2 z-20 grid h-8 w-8 place-items-center md:bottom-auto md:top-1/2 md:-translate-y-1/2 rounded-full border border-white/30 bg-white/15 text-white shadow-lg backdrop-blur-md transition duration-300 hover:scale-110 hover:bg-white/30 md:h-12 md:w-12 md:opacity-0 md:group-hover:opacity-100 md:group-focus-visible:opacity-100",
                  side === "left" ? "left-3 md:left-4" : "right-3 md:right-4",
                )}
              >
                <Icon width={20} height={20} />
              </button>
            );
          })}
          <div className="absolute inset-x-0 bottom-3 z-20 flex justify-center gap-2 md:bottom-4" role="group" aria-label={t("pick")}>
            {photos.map((ph, k) => (
              <button
                key={ph.id}
                type="button"
                tabIndex={-1}
                aria-label={t("slide", { n: k + 1 })}
                aria-current={k === i}
                onClick={() => setI(k)}
                className={cn("h-2 rounded-full transition-all duration-500", k === i ? "w-8 bg-pink shadow-glow" : "w-2 bg-white/60 hover:bg-white")}
              />
            ))}
          </div>
        </>
      )}
    </div>
    </section>
    {/* banner credit sits under the frame (nothing is drawn over banner artwork); fixed height = no layout shift */}
    <p className="mt-1.5 h-4 text-right text-[0.7rem] leading-4 text-muted" aria-live="off">{p?.plain && p.credit ? t(`credit.${p.credit}`) : ""}</p>
    </>
  );
}
