"use client";

import Link from "next/link";
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "outline" | "outline-dark" | "ghost";

const BASE =
  "relative inline-flex items-center justify-center overflow-hidden rounded-full px-8 py-3.5 font-display text-lg font-semibold transition-shadow duration-300 select-none";
const VARIANTS: Record<Variant, string> = {
  // 18px / 600 weight counts as "large text" for WCAG AA on pink-500 (3.6:1).
  primary: "bg-pink text-white hover:shadow-glow",
  outline: "border-2 border-on-brand text-on-brand hover:bg-white/10",
  "outline-dark": "border-2 border-brand text-ink hover:bg-brand hover:text-on-brand",
  ghost: "text-ink hover:text-pink",
};

type Props = {
  href?: string;
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
};

/** Button with magnetic hover (pointer devices) and ripple on press. */
export function Button({ href, variant = "primary", className, children, type = "button", disabled, onClick }: Props) {
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 18 });
  const sy = useSpring(y, { stiffness: 220, damping: 18 });
  const ref = useRef<HTMLSpanElement>(null);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  const onMove = (e: React.PointerEvent) => {
    if (reduce || e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * 0.18);
    y.set((e.clientY - (r.top + r.height / 2)) * 0.28);
  };
  const reset = () => { x.set(0); y.set(0); };
  const onDown = (e: React.PointerEvent) => {
    if (reduce || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const id = Date.now() + Math.random();
    setRipples((rs) => [...rs, { id, x: e.clientX - r.left, y: e.clientY - r.top }]);
    setTimeout(() => setRipples((rs) => rs.filter((q) => q.id !== id)), 600);
  };

  const cls = cn(BASE, VARIANTS[variant], disabled && "opacity-60 pointer-events-none", className);
  const inner = (
    <>
      <span className="relative z-10">{children}</span>
      {ripples.map((r) => (
        <span
          key={r.id}
          aria-hidden
          className="pointer-events-none absolute h-16 w-16 rounded-full bg-white/50"
          style={{ left: r.x - 32, top: r.y - 32, animation: "ripple 600ms var(--ease-out) forwards" }}
        />
      ))}
    </>
  );

  return (
    <motion.span ref={ref} style={{ x: sx, y: sy }} className="inline-block" onPointerMove={onMove} onPointerLeave={reset}>
      {href ? (
        <Link href={href} className={cls} onPointerDown={onDown}>{inner}</Link>
      ) : (
        <button type={type} className={cls} disabled={disabled} onClick={onClick} onPointerDown={onDown}>{inner}</button>
      )}
    </motion.span>
  );
}
