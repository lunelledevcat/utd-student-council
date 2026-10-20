"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useLocaleSwitch } from "@/components/i18n/LocaleProvider";
import { Icon, type IconName } from "@/components/icons/Icon";
import { routing } from "@/i18n/routing";
import { CHANNELS, EMAIL_PARTS, joinEmail } from "@/lib/contact";
import { cn } from "@/lib/utils";

type Key = "language" | (typeof CHANNELS)[number]["key"] | "email";
const ORDER: Key[] = ["language", "instagram", "facebook", "tiktok", "email"];
const ICON: Record<Key, IconName> = { language: "globe", instagram: "instagram", facebook: "facebook", tiktok: "tiktok", email: "mail" };
const SPRING = { type: "spring", stiffness: 520, damping: 40 } as const;

/**
 * Phones (< md): the menu button opens a vertical rail of 44 px round icons under it, right-aligned:
 * language → Instagram → Facebook → TikTok → e-mail. Tapping an icon stretches it into a capsule with its text
 * (one at a time; tapping again closes it). The capsule grows with a layout (transform) animation, so only the
 * compositor works. Closes on outside tap, Esc, scroll and page change. Reduced motion: no animation.
 * E-mail addresses are joined in the browser only when the e-mail item is opened (not in the HTML).
 */
export function MobileDock() {
  const t = useTranslations();
  const reduce = useReducedMotion();
  const pathname = usePathname();
  const { locale, switchLocale, switching } = useLocaleSwitch();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<Key | null>(null);
  const [emails, setEmails] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const firstItem = useRef<HTMLButtonElement>(null);

  const close = (focusButton = false) => {
    setOpen(false);
    setActive(null);
    if (focusButton) button.current?.focus();
  };

  // close on page change (pathname is the only input; the effect only resets state when it changes)
  const [seenPath, setSeenPath] = useState(pathname);
  if (seenPath !== pathname) {
    setSeenPath(pathname);
    setOpen(false);
    setActive(null);
  }

  useEffect(() => {
    if (!open) return;
    firstItem.current?.focus();
    const outside = (e: PointerEvent) => wrap.current && !wrap.current.contains(e.target as Node) && close();
    const scroll = () => close();
    document.addEventListener("pointerdown", outside);
    window.addEventListener("scroll", scroll, { passive: true, once: true });
    return () => {
      document.removeEventListener("pointerdown", outside);
      window.removeEventListener("scroll", scroll);
    };
  }, [open]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(id);
  }, [toast]);

  const toggle = (k: Key) => {
    const next = active === k ? null : k;
    if (next === "email" && !emails.length) setEmails(EMAIL_PARTS.map(joinEmail));
    setActive(next);
  };

  const copy = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      setToast(t("dock.copied"));
    } catch {
      setToast(t("dock.copyFailed"));
    }
  };

  // light focus trap: Tab cycles between the menu button and the rail while it is open; Esc closes
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === "Escape") {
      e.preventDefault();
      close(true);
      return;
    }
    if (e.key !== "Tab" || !wrap.current) return;
    const items = Array.from(wrap.current.querySelectorAll<HTMLElement>("button:not([disabled]), a[href]"));
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const label = (k: Key) => (k === "language" ? t("dock.language") : k === "email" ? t("dock.email") : t(`contact.${k}`));
  const channel = (k: Key) => CHANNELS.find((c) => c.key === k);

  return (
    <div ref={wrap} className="relative md:hidden" onKeyDown={onKeyDown}>
      <button
        ref={button}
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-expanded={open}
        aria-controls="contact-dock"
        aria-label={t(open ? "lang.closeMenu" : "lang.openMenu")}
        className="relative grid h-11 w-11 place-items-center rounded-full border border-white/25 bg-white/10"
      >
        {/* three bars morph into an X */}
        {[-6, 0, 6].map((y, i) => (
          <motion.span
            key={i}
            aria-hidden
            className="absolute h-[2px] w-5 rounded-full bg-white"
            initial={false}
            animate={open ? (i === 1 ? { opacity: 0, scaleX: 0.2 } : { y: 0, rotate: i === 0 ? 45 : -45 }) : { y, rotate: 0, opacity: 1, scaleX: 1 }}
            transition={reduce ? { duration: 0 } : SPRING}
          />
        ))}
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            id="contact-dock"
            aria-label={t("dock.label")}
            className="absolute right-0 top-full z-40 mt-2 flex w-[calc(100vw-2rem)] max-w-[22rem] flex-col items-end gap-2"
            initial="hidden"
            animate="shown"
            exit="hidden"
            variants={{ shown: { transition: reduce ? {} : { staggerChildren: 0.045 } }, hidden: { transition: reduce ? {} : { staggerChildren: 0.03, staggerDirection: -1 } } }}
          >
            {ORDER.map((k, i) => {
              const isOpen = active === k;
              const c = channel(k);
              return (
                <motion.li
                  key={k}
                  className="flex max-w-full justify-end"
                  variants={{ hidden: { opacity: 0, y: -10, scale: 0.85 }, shown: { opacity: 1, y: 0, scale: 1 } }}
                  transition={reduce ? { duration: 0 } : SPRING}
                >
                  <motion.div
                    layout={!reduce}
                    transition={SPRING}
                    style={{ borderRadius: 22 }}
                    className="flex max-w-full flex-row-reverse items-center overflow-hidden border border-white/20 bg-brand-deep/95 text-on-brand shadow-[0_10px_24px_-10px_rgb(5_13_36/0.7)] backdrop-blur-md"
                  >
                    <motion.button
                      layout={!reduce ? "position" : false}
                      ref={i === 0 ? firstItem : undefined}
                      type="button"
                      onClick={() => toggle(k)}
                      aria-expanded={isOpen}
                      aria-controls={`dock-${k}`}
                      aria-label={label(k)}
                      className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-full", isOpen && "bg-white/10")}
                    >
                      <Icon name={ICON[k]} size={20} className="text-white" />
                    </motion.button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          id={`dock-${k}`}
                          key="content"
                          layout={!reduce ? "position" : false}
                          initial={{ opacity: 0, x: 12 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 12 }}
                          transition={reduce ? { duration: 0 } : { duration: 0.18 }}
                          className="min-w-0 py-1.5 pl-4 pr-1 text-sm"
                        >
                          {k === "language" && (
                            <div role="group" aria-label={t("lang.menu")} className="flex items-center gap-1">
                              {routing.locales.map((l) => (
                                <button
                                  key={l}
                                  type="button"
                                  lang={l}
                                  disabled={switching}
                                  aria-pressed={l === locale}
                                  onClick={() => { close(); if (l !== locale) switchLocale(l); }}
                                  className={cn("h-9 rounded-full px-3 font-semibold", l === locale ? "bg-pink-soft text-pink-ink" : "hover:bg-white/10")}
                                >
                                  {t(`lang.${l}`)}
                                </button>
                              ))}
                            </div>
                          )}
                          {c && (
                            <a href={c.href} target="_blank" rel="noopener noreferrer nofollow" className="block truncate py-2 pr-2 font-semibold underline-offset-4 hover:underline">
                              {c.label}
                            </a>
                          )}
                          {k === "email" && (
                            <ul className="space-y-0.5">
                              {emails.map((m) => (
                                <li key={m} className="flex items-center gap-1">
                                  <a href={`mailto:${m}`} aria-label={t("dock.sendEmail", { email: m })} className="min-w-0 truncate py-2 font-semibold underline-offset-4 hover:underline">
                                    {m}
                                  </a>
                                  <button type="button" onClick={() => copy(m)} aria-label={t("dock.copyEmail", { email: m })} className="grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-white/10">
                                    <Icon name="copy" size={16} className="text-white" />
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </motion.li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* copy feedback */}
      <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center">
        <AnimatePresence>
          {toast && (
            <motion.span
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={reduce ? { duration: 0 } : { duration: 0.2 }}
              className="rounded-full bg-brand-deep px-4 py-2 text-sm font-semibold text-on-brand shadow-lg"
            >
              {toast}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
