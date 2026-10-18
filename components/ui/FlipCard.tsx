"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";

/** Click / Enter / Space flips the card (also on hover for mouse). Reduced motion: crossfade instead of 3D. */
export function FlipCard({
  front,
  back,
  label,
  className = "h-64",
}: {
  front: React.ReactNode;
  back: React.ReactNode;
  label: string;
  className?: string;
}) {
  const [flipped, setFlipped] = useState(false);
  const reduce = useReducedMotion();
  const t = { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <button
      type="button"
      aria-pressed={flipped}
      aria-label={`${label} — กดเพื่อ${flipped ? "ดูด้านหน้า" : "ดูความหมาย"}`}
      onClick={() => setFlipped((f) => !f)}
      onPointerEnter={(e) => e.pointerType === "mouse" && setFlipped(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setFlipped(false)}
      className={`relative block w-full text-left [perspective:1000px] ${className}`}
    >
      <motion.div
        className="relative h-full w-full [transform-style:preserve-3d]"
        animate={reduce ? undefined : { rotateY: flipped ? 180 : 0 }}
        transition={t}
      >
        <div
          className="absolute inset-0 rounded-lg border border-line bg-surface p-6 shadow-soft [backface-visibility:hidden]"
          style={reduce ? { opacity: flipped ? 0 : 1 } : undefined}
        >
          {front}
        </div>
        <div
          className="absolute inset-0 rounded-lg bg-brand p-6 text-on-brand [backface-visibility:hidden]"
          style={reduce ? { opacity: flipped ? 1 : 0 } : { transform: "rotateY(180deg)" }}
        >
          {back}
        </div>
      </motion.div>
    </button>
  );
}
