"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useSpring } from "motion/react";
import { useEffect, useState } from "react";
import { NAV, SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const isDark = saved ? saved === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(isDark);
    if (saved) document.documentElement.dataset.theme = saved;
  }, []);
  return (
    <button
      type="button"
      aria-label={dark ? "สลับเป็นโหมดสว่าง" : "สลับเป็นโหมดมืด"}
      aria-pressed={dark}
      className="grid h-10 w-10 place-items-center rounded-full text-on-brand hover:bg-white/15"
      onClick={() => {
        const next = dark ? "light" : "dark";
        setDark(!dark);
        document.documentElement.dataset.theme = next;
        localStorage.setItem("theme", next);
      }}
    >
      <span aria-hidden>{dark ? "☀" : "☾"}</span>
    </button>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollY, scrollYProgress } = useScroll();
  const bar = useSpring(scrollYProgress, { stiffness: 120, damping: 24 });
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 40));
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <motion.div aria-hidden style={{ scaleX: bar }} className="fixed inset-x-0 top-0 z-[70] h-1 origin-left bg-pink" />
      <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 lg:px-20">
        <nav
          aria-label="เมนูหลัก"
          className={cn(
            "mx-auto flex max-w-[1280px] items-center justify-between rounded-full border text-on-brand backdrop-blur-xl transition-all duration-300",
            scrolled
              ? "border-white/10 bg-brand-deep/90 px-5 py-2 shadow-soft"
              : "border-white/25 bg-white/10 px-6 py-3",
          )}
        >
          <Link href="/" className="flex items-center gap-3" aria-label={`${SITE.name} หน้าแรก`}>
            <span className="no-select grid h-10 w-10 place-items-center rounded-full bg-gold font-display text-sm font-semibold text-brand-deep" title="[ใส่โลโก้สภานักเรียน]">
              {SITE.abbr}
            </span>
            <span className="font-display text-lg font-semibold">สภานักเรียน {SITE.abbr}</span>
          </Link>

          <ul className="hidden items-center gap-5 xl:flex">
            {NAV.map((n) => {
              const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
              return (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    aria-current={active ? "page" : undefined}
                    className={cn("text-[15px] font-medium transition-colors hover:text-pink-soft", active && "border-b-2 border-pink")}
                  >
                    {n.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/voice" className="hidden rounded-full bg-pink px-5 py-2 font-display text-[17px] font-semibold text-white transition-shadow hover:shadow-glow sm:inline-block">
              ส่งความคิดเห็น
            </Link>
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full hover:bg-white/15 xl:hidden"
              aria-label={open ? "ปิดเมนู" : "เปิดเมนู"}
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen((o) => !o)}
            >
              <span aria-hidden className="text-xl">{open ? "✕" : "☰"}</span>
            </button>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-40 flex flex-col justify-center bg-brand-deep px-8 text-on-brand xl:hidden"
          >
            <ul className="flex flex-col gap-2">
              {NAV.map((n, i) => (
                <motion.li key={n.href} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                  <Link href={n.href} className="block py-2 font-display text-3xl font-semibold hover:text-pink">{n.label}</Link>
                </motion.li>
              ))}
            </ul>
            <Link href="/voice" className="mt-8 w-fit rounded-full bg-pink px-8 py-3.5 font-display text-lg font-semibold text-white">ส่งความคิดเห็น</Link>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
