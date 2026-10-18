"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";
import { Mandapa } from "@/components/ui/Mandapa";

gsap.registerPlugin(ScrollTrigger);

// Three depth layers, each scrolls at a different speed (px moved over the hero's height).
const LAYERS = [
  { speed: 60, cls: "right-[-8%] top-[-4%] h-[110%] w-[75%] text-brand-mid opacity-40", stroke: undefined },
  { speed: 140, cls: "right-[-2%] top-[18%] h-[95%] w-[62%] text-brand-deep opacity-60", stroke: undefined },
  { speed: 240, cls: "right-[2%] top-[40%] h-[75%] w-[50%] text-brand-deep opacity-95", stroke: "var(--c-gold)" },
];

export function HeroParallax() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const ctx = gsap.context(() => {
        gsap.utils.toArray<HTMLElement>("[data-speed]").forEach((el) => {
          gsap.to(el, {
            y: Number(el.dataset.speed),
            ease: "none",
            scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
          });
        });
      }, root);
      return () => ctx.revert();
    });
    return () => mm.revert();
  }, []);

  return (
    <div ref={root} aria-hidden className="no-select pointer-events-none absolute inset-0 overflow-hidden">
      {LAYERS.map((l, i) => (
        <div key={i} data-speed={l.speed} className={`absolute will-change-transform ${l.cls}`}>
          <Mandapa className="h-full w-full" fill="currentColor" stroke={l.stroke} />
        </div>
      ))}
    </div>
  );
}
