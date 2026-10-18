"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { Photo } from "@/lib/content";
import { cn } from "@/lib/utils";

const INTERVAL = 6000;
// Ken Burns: each slide drifts toward a different corner
const ORIGINS = ["20% 30%", "80% 25%", "70% 80%", "25% 75%"];

/** Full-bleed hero slideshow: slow Ken Burns, 1.2 s crossfade, auto-advance 6 s, pauses on hover/focus, swipe on touch. */
export function HeroSlides({ photos }: { photos: Photo[] }) {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const start = useRef<number | null>(null);
  const n = photos.length;

  useEffect(() => {
    if (paused || n < 2) return;
    const t = setTimeout(() => setI((x) => (x + 1) % n), INTERVAL);
    return () => clearTimeout(t);
  }, [i, paused, n]);

  const go = (d: number) => setI((x) => (x + d + n) % n);
  const p = photos[i];

  return (
    <div
      className="absolute inset-0"
      onPointerEnter={(e) => e.pointerType === "mouse" && setPaused(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onPointerDown={(e) => { start.current = e.clientX; }}
      onPointerUp={(e) => {
        if (start.current === null || n < 2) return;
        const dx = e.clientX - start.current;
        start.current = null;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
      }}
      style={{ touchAction: "pan-y" }}
    >
      <AnimatePresence initial={false}>
        <motion.img
          key={p.id}
          src={p.src[1920]}
          srcSet={`${p.src[480]} 480w, ${p.src[960]} 960w, ${p.src[1920]} 1920w`}
          sizes="(max-width: 768px) 100vw, 1320px"
          alt={p.caption || "ภาพกิจกรรมสภานักเรียน"}
          width={p.w}
          height={p.h}
          draggable={false}
          fetchPriority={i === 0 ? "high" : "auto"}
          className="no-select absolute inset-0 h-full w-full object-cover"
          style={{ transformOrigin: ORIGINS[i % ORIGINS.length], backgroundImage: p.blur ? `url(${p.blur})` : undefined, backgroundSize: "cover" }}
          initial={{ opacity: 0, scale: 1 }}
          animate={{ opacity: 1, scale: reduce ? 1 : 1.1 }}
          exit={{ opacity: 0 }}
          transition={{ opacity: { duration: 1.2 }, scale: { duration: (INTERVAL + 1200) / 1000, ease: "linear" } }}
        />
      </AnimatePresence>
      {n > 1 && (
        <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center gap-2" role="group" aria-label="เลือกสไลด์">
          {photos.map((ph, k) => (
            <button
              key={ph.id}
              type="button"
              aria-label={`สไลด์ที่ ${k + 1}`}
              aria-current={k === i}
              onClick={() => setI(k)}
              className={cn("h-2.5 rounded-full transition-all duration-500", k === i ? "w-8 bg-pink shadow-glow" : "w-2.5 bg-white/60 hover:bg-white")}
            />
          ))}
        </div>
      )}
    </div>
  );
}
