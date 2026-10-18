"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { MILESTONES } from "@/lib/site";

gsap.registerPlugin(ScrollTrigger);

/** Horizontal, scrollable on small screens. Connector line draws with scroll; year dots pop in. */
export function Timeline({ dark }: { dark?: boolean }) {
  const reduce = useReducedMotion();
  const wrap = useRef<HTMLDivElement>(null);
  const line = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduce || !line.current || !wrap.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        line.current,
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: "none",
          transformOrigin: "left center",
          scrollTrigger: { trigger: wrap.current, start: "top 85%", end: "bottom 55%", scrub: true },
        },
      );
    }, wrap);
    return () => ctx.revert();
  }, [reduce]);

  return (
    <div ref={wrap} className="-mx-4 overflow-x-auto px-4 pb-4 [scrollbar-width:thin] lg:mx-0 lg:overflow-visible lg:px-0" tabIndex={0} aria-label="ไทม์ไลน์ประวัติโรงเรียน (เลื่อนดูได้)">
      <ol className="relative grid min-w-[1000px] grid-cols-6 gap-4 lg:min-w-0">
        <div aria-hidden className={`absolute left-2 right-2 top-2 h-0.5 ${dark ? "bg-white/20" : "bg-line"}`} />
        <div ref={line} aria-hidden className="absolute left-2 right-2 top-2 h-0.5 bg-gold" style={{ transform: reduce ? undefined : "scaleX(0)" }} />
        {MILESTONES.map((m, i) => (
          <li key={m.year} className="relative space-y-3 pt-8">
            <motion.span
              aria-hidden
              className="absolute left-0 top-0 h-[18px] w-[18px] rounded-full bg-pink"
              initial={reduce ? false : { scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ type: "spring", stiffness: 320, damping: 14, delay: i * 0.08 }}
            />
            <p className="font-serif text-4xl font-bold text-gold" style={{ fontFamily: "var(--font-noto-serif)" }}>{m.year}</p>
            <p className="pr-2 text-[15px]">{m.text}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
