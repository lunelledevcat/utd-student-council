"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { IconFacebook, IconInstagram, IconMoon, IconSun } from "@/components/ui/icons";
import { SITE } from "@/lib/site";

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const isDark = saved ? saved === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only storage; read after hydration to avoid SSR mismatch
    setDark(isDark);
    if (saved) document.documentElement.dataset.theme = saved;
  }, []);
  return (
    <button
      type="button"
      aria-label={dark ? "สลับเป็นโหมดสว่าง" : "สลับเป็นโหมดมืด"}
      aria-pressed={dark}
      className="grid h-9 w-9 place-items-center rounded-full border border-white/15 sm:h-10 sm:w-10 bg-white/5 text-on-brand transition hover:-translate-y-0.5 hover:bg-white/15"
      onClick={() => {
        const next = dark ? "light" : "dark";
        setDark(!dark);
        document.documentElement.dataset.theme = next;
        localStorage.setItem("theme", next);
      }}
    >
      {dark ? <IconSun width={18} height={18} /> : <IconMoon width={18} height={18} />}
    </button>
  );
}

/** Round logo slot. [placeholder] until the real crest / council logo files are added to /public. */
function LogoSlot({ label, text, delay }: { label: string; text: string; delay: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.span
      title={label}
      aria-hidden
      initial={reduce ? false : { scale: 0.3, opacity: 0, rotate: -20 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 380, damping: 16, delay }}
      className="no-select grid h-9 w-9 shrink-0 sm:h-11 sm:w-11 place-items-center rounded-full bg-white font-display text-[0.7rem] font-semibold leading-none text-brand shadow-[0_0_0_3px_rgb(255_255_255/0.15)] md:h-[54px] md:w-[54px] md:text-xs"
    >
      {text}
    </motion.span>
  );
}

const SOCIAL = [
  { label: "Facebook", href: SITE.facebook, Icon: IconFacebook },
  { label: "Instagram", href: SITE.instagram, Icon: IconInstagram },
];

export function Navbar() {
  return (
    <header className="relative z-30 overflow-hidden bg-gradient-to-r from-brand-deep via-[#0a1a40] to-[#0e2a66] text-on-brand shadow-[0_6px_24px_-8px_rgb(5_13_36/0.6)]">
      <span aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-pink/20 blur-3xl" />
      <nav aria-label="ส่วนหัว" className="relative mx-auto flex max-w-[1320px] items-center justify-between gap-3 px-4 py-3 md:py-4">
        <Link href="/" className="flex min-w-0 items-center gap-2.5 md:gap-3" aria-label={`${SITE.name} หน้าแรก`}>
          <LogoSlot label="[โลโก้โรงเรียน]" text="[ตรา]" delay={0.05} />
          <LogoSlot label="[โลโก้สภานักเรียน]" text="[สภา]" delay={0.15} />
          <span className="ml-1 min-w-0">
            <span className="line-clamp-2 block font-display text-[0.85rem] font-semibold leading-tight sm:truncate sm:text-[1.1rem] sm:leading-snug md:text-[1.35rem]">{SITE.name}</span>
            <span className="hidden truncate text-[0.7rem] tracking-[0.06em] text-on-brand/60 sm:block md:text-sm">{SITE.nameEn}</span>
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {SOCIAL.map(({ label, href, Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="inline-flex h-9 items-center gap-2 rounded-full border border-white/20 bg-white/5 px-2.5 sm:h-10 sm:px-3 text-sm font-medium transition duration-300 hover:-translate-y-0.5 hover:border-pink-400/70 hover:bg-white/10 hover:shadow-glow md:px-4"
            >
              <Icon width={17} height={17} />
              <span className="hidden md:inline">{label}</span>
            </a>
          ))}
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
