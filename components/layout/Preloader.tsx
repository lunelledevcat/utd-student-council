"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { MANDAPA_PATH, SITE } from "@/lib/site";

const KEY = "utd-preloader-seen";

/** Gold line draws the mandapa, then fades to the council logo. Once per session. */
export function Preloader() {
  const reduce = useReducedMotion();
  const [show, setShow] = useState(true);
  const [logo, setLogo] = useState(false);

  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem(KEY) === "1"; } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect -- session flag lives in browser storage
    if (seen || reduce) { setShow(false); return; }
    const a = setTimeout(() => setLogo(true), 1200);
    const b = setTimeout(() => {
      setShow(false);
      try { sessionStorage.setItem(KEY, "1"); } catch {}
    }, 2100);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [reduce]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="preloader"
          role="status"
          aria-label="กำลังโหลด"
          className="fixed inset-0 z-[100] grid place-items-center bg-brand-deep"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="relative grid h-64 w-80 place-items-center">
            <motion.svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full" animate={{ opacity: logo ? 0 : 1 }} transition={{ duration: 0.4 }}>
              <motion.path
                d={MANDAPA_PATH}
                fill="none"
                stroke="var(--c-gold)"
                strokeWidth={2}
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              />
            </motion.svg>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: logo ? 1 : 0, scale: logo ? 1 : 0.9 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="no-select grid h-28 w-28 place-items-center rounded-full bg-gold font-display text-3xl font-bold text-brand-deep"
              title="[ใส่โลโก้สภานักเรียน]"
            >
              {SITE.abbr}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
