"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Animates text word by word. `words` come from Intl.Segmenter('th') on the server
 * (see thaiWords), so vowels/tone marks never get split.
 */
export function WordReveal({ words, delay = 0, className }: { words: string[]; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <span className={className} aria-label={words.join("")}>
      {words.map((w, i) =>
        w.trim() === "" ? (
          <span key={i} aria-hidden>{w}</span>
        ) : (
          <motion.span
            key={i}
            aria-hidden
            className="inline-block"
            initial={reduce ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: delay + i * 0.08 }}
          >
            {w}
          </motion.span>
        ),
      )}
    </span>
  );
}
