"use client";

import { NextIntlClientProvider, useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import type { L } from "@/lib/content";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

type Messages = Record<Locale, Record<string, unknown>>;
type Ctx = { locale: Locale; switching: boolean; switchLocale: (next: Locale) => void };
const LocaleCtx = createContext<Ctx | null>(null);

// Pages rendered on the server (back office, sign-in) switch language with a normal navigation; public pages switch
// in place so the open tab, popup and scroll position survive (both message bundles and both-language content are
// already in the browser; the URL is updated with history.replaceState).
const SERVER_RENDERED = /^\/(th|en)\/(dashboard|login|pending-access)(\/|$)/;
const COOKIE = "NEXT_LOCALE";

const visible = (el: HTMLElement) => {
  const r = el.getBoundingClientRect();
  return r.bottom > 0 && r.top < innerHeight && r.width > 0;
};

/** Blur + fade + small rise on every visible [data-swap] block, staggered top to bottom. Resolves when done. */
function animateBlocks(phase: "out" | "in", els: HTMLElement[], reduce: boolean) {
  const kf: Keyframe[] = reduce
    ? [{ opacity: phase === "out" ? 1 : 0 }, { opacity: phase === "out" ? 0 : 1 }]
    : phase === "out"
      ? [{ opacity: 1, filter: "blur(0px)", transform: "translateY(0)" }, { opacity: 0, filter: "blur(4px)", transform: "translateY(-4px)" }]
      : [{ opacity: 0, filter: "blur(4px)", transform: "translateY(6px)" }, { opacity: 1, filter: "blur(0px)", transform: "translateY(0)" }];
  const anims = els.map((el, i) =>
    el.animate(kf, { duration: phase === "out" ? 140 : 220, delay: Math.min(i, 12) * 18, easing: phase === "out" ? "ease-in" : "cubic-bezier(.22,1,.36,1)", fill: "both" }),
  );
  return Promise.all(anims.map((a) => a.finished.catch(() => undefined))).then(() => anims);
}

export function LocaleProvider({ initial, messages, children }: { initial: Locale; messages: Messages; children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>(initial);
  const [switching, setSwitching] = useState(false);
  const busy = useRef(false);
  const pathname = usePathname();
  const router = useRouter();

  // a navigation to another locale (e.g. a link) re-renders this provider with a new `initial`
  const [seen, setSeen] = useState(initial);
  if (seen !== initial) {
    setSeen(initial);
    setLocale(initial);
  }

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const switchLocale = useCallback(
    async (next: Locale) => {
      if (next === locale || busy.current) return;
      const path = window.location.pathname.replace(/^\/(th|en)(?=\/|$)/, `/${next}`);
      const url = path + window.location.search + window.location.hash;
      document.cookie = `${COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
      if (SERVER_RENDERED.test(pathname)) {
        router.replace(url, { scroll: false });
        return;
      }
      busy.current = true;
      setSwitching(true);
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const els = Array.from(document.querySelectorAll<HTMLElement>("[data-swap]")).filter(visible).sort(
        (a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top || a.getBoundingClientRect().left - b.getBoundingClientRect().left,
      );
      const out = await animateBlocks("out", els, reduce);
      const oldTitle = (messages[locale].meta as Record<string, string>).title;
      const newTitle = (messages[next].meta as Record<string, string>).title;
      flushSync(() => setLocale(next));
      window.history.replaceState(window.history.state, "", url);
      document.title = document.title.replace(oldTitle, newTitle);
      const back = await animateBlocks("in", els, reduce);
      [...out, ...back].forEach((a) => a.cancel());
      busy.current = false;
      setSwitching(false);
    },
    [locale, messages, pathname, router],
  );

  return (
    <LocaleCtx.Provider value={{ locale, switching, switchLocale }}>
      <NextIntlClientProvider locale={locale} messages={messages[locale]} timeZone="Asia/Bangkok">
        {children}
      </NextIntlClientProvider>
    </LocaleCtx.Provider>
  );
}

export function useLocaleSwitch() {
  const c = useContext(LocaleCtx);
  if (!c) throw new Error("useLocaleSwitch outside LocaleProvider");
  return c;
}

/** Picks the current language from bilingual content; `fallback` = English requested but missing. */
export function useL() {
  const locale = useLocale();
  return useCallback(<T,>(v: L<T>) => {
    const fallback = locale === "en" && v.en === null;
    return { value: locale === "en" && v.en !== null ? v.en : v.th, fallback };
  }, [locale]);
}

/** Small "TH" label shown next to text that has no English version yet. */
export function ThBadge({ className }: { className?: string }) {
  const t = useTranslations("common");
  return (
    <span
      title={t("thOnlyTitle")}
      aria-label={t("thOnlyTitle")}
      className={cn("ml-1.5 inline-flex translate-y-[-1px] items-center rounded-[5px] border border-line bg-surface-2 px-1 align-middle font-sans text-[0.6rem] font-semibold leading-[1.35] tracking-wide text-muted", className)}
    >
      {t("thOnly")}
    </span>
  );
}

/** Bilingual text with the fallback label. */
export function Tx({ v, badge = true }: { v: L; badge?: boolean }) {
  const pick = useL();
  const { value, fallback } = pick(v);
  return (
    <>
      <span lang={fallback ? "th" : undefined}>{value}</span>
      {fallback && badge && <ThBadge />}
    </>
  );
}
