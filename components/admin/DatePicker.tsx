"use client";

import { format, isValid, parse, subDays } from "date-fns";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import { enUS, th } from "react-day-picker/locale";
import "react-day-picker/style.css";
import { IconCalendar } from "@/components/icons/Icon";
import { cn, formatDate } from "@/lib/utils";

const ISO = "yyyy-MM-dd";
const toIso = (d: Date) => format(d, ISO);
const fromIso = (s: string) => {
  const d = parse(s, ISO, new Date());
  return isValid(d) ? d : undefined;
};

/** Month names for parsing typed dates ("19 ต.ค. 2569", "19 Oct 2026", "19/10/2569", "2026-10-19"). */
function monthIndex(word: string) {
  const w = word.toLowerCase().replace(/\./g, "");
  for (const loc of ["th-TH", "en-US"]) {
    for (const style of ["short", "long"] as const) {
      const f = new Intl.DateTimeFormat(loc, { month: style, timeZone: "UTC" });
      for (let m = 0; m < 12; m++) if (f.format(Date.UTC(2026, m, 15)).toLowerCase().replace(/\./g, "") === w) return m;
    }
  }
  return -1;
}
/** Typed text -> ISO, or null. Years above 2400 are Buddhist era. */
export function parseTyped(text: string): string | null {
  const s = text.trim();
  if (!s) return null;
  const ce = (y: number) => (y > 2400 ? y - 543 : y < 100 ? 2000 + y : y);
  let y: number, m: number, d: number;
  const nums = s.match(/\d+/g)?.map(Number) ?? [];
  // the month word keeps its dots ("ต.ค.") — monthIndex() ignores them when comparing
  const word = s.replace(/\d+/g, " ").replace(/[/,-]/g, " ").trim().split(/\s+/).find((w) => /\p{L}/u.test(w)) ?? "";
  if (word && monthIndex(word) >= 0 && nums.length >= 2) [d, m, y] = [nums[0], monthIndex(word) + 1, nums[1]];
  else if (nums.length === 3 && nums[0] > 31) [y, m, d] = nums;
  else if (nums.length === 3) [d, m, y] = nums;
  else return null;
  const date = new Date(ce(y), m - 1, d);
  return isValid(date) && date.getDate() === d && date.getMonth() === m - 1 ? toIso(date) : null;
}

/**
 * Date field for the back office: localized text input (typed dates accepted) + a themed calendar popover
 * (Thai months with Buddhist-era years in Thai, shortcuts, today/clear). Submits ISO YYYY-MM-DD under `name`.
 * Phones get a bottom sheet. ESC / outside click closes; keyboard navigation comes from react-day-picker.
 */
export function DatePicker({
  name, defaultValue, required, invalid, describedBy, id,
}: { name: string; defaultValue?: string; required?: boolean; invalid?: boolean; describedBy?: string; id?: string }) {
  const t = useTranslations("dashboard.date");
  const locale = useLocale();
  const reduce = useReducedMotion();
  const [value, setValue] = useState(defaultValue && fromIso(defaultValue) ? defaultValue : "");
  const [text, setText] = useState(value ? formatDate(value, locale) : "");
  const [bad, setBad] = useState(false);
  const [open, setOpen] = useState(false);
  const [sheet, setSheet] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const dialogId = useId();

  const commit = (iso: string) => {
    setValue(iso);
    setText(iso ? formatDate(iso, locale) : "");
    setBad(false);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && (e.stopPropagation(), setOpen(false));
    const onDown = (e: PointerEvent) => box.current && !box.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  const selected = value ? fromIso(value) : undefined;
  const be = locale === "th";
  const weekdays = t("weekdays").split(",");
  const today = new Date();
  const shortcuts: [string, Date][] = [[t("today"), today], [t("yesterday"), subDays(today, 1)], [t("lastWeek"), subDays(today, 7)]];

  const calendar = (
    <div className="utd-rdp">
      <DayPicker
        mode="single"
        selected={selected}
        defaultMonth={selected ?? today}
        onSelect={(d) => { if (d) { commit(toIso(d)); setOpen(false); } }}
        locale={be ? th : enUS}
        captionLayout="dropdown"
        startMonth={new Date(2015, 0)}
        endMonth={new Date(today.getFullYear() + 3, 11)}
        autoFocus
        formatters={{
          formatCaption: (m) => `${new Intl.DateTimeFormat(be ? "th-TH" : "en-US", { month: "long" }).format(m)} ${m.getFullYear() + (be ? 543 : 0)}`,
          formatYearDropdown: (y) => String(y.getFullYear() + (be ? 543 : 0)),
          formatMonthDropdown: (m) => new Intl.DateTimeFormat(be ? "th-TH" : "en-US", { month: "long" }).format(m),
          formatWeekdayName: (d) => weekdays[d.getDay()],
        }}
      />
      <div className="flex flex-wrap items-center gap-1.5 border-t border-line px-3 py-2.5">
        {shortcuts.map(([label, d]) => (
          <button key={label} type="button" onClick={() => { commit(toIso(d)); setOpen(false); }} className="rounded-full bg-surface-2 px-3 py-1 text-xs font-medium text-ink hover:bg-sky">
            {label}
          </button>
        ))}
        <button type="button" onClick={() => { commit(""); setOpen(false); }} className="ml-auto rounded-full px-3 py-1 text-xs font-medium text-muted hover:text-danger">
          {t("clear")}
        </button>
      </div>
    </div>
  );

  return (
    <div ref={box} className="relative">
      <input type="hidden" name={name} value={value} />
      <div className="relative">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={text}
          placeholder={t("placeholder")}
          required={required}
          aria-invalid={invalid || bad}
          aria-describedby={describedBy}
          onChange={(e) => { setText(e.target.value); setBad(false); }}
          onBlur={() => {
            if (!text.trim()) return commit("");
            const iso = parseTyped(text);
            if (iso) commit(iso);
            else setBad(true);
          }}
          onKeyDown={(e) => { if (e.key === "ArrowDown" && e.altKey) { e.preventDefault(); setSheet(matchMedia("(max-width: 639px)").matches); setOpen(true); } }}
          className={cn("h-11 w-full rounded-xl border border-line bg-surface pl-3.5 pr-12 text-ink outline-none transition focus:border-pink aria-[invalid=true]:border-danger")}
        />
        <button
          type="button"
          aria-label={t("open")}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={dialogId}
          onClick={() => { setSheet(matchMedia("(max-width: 639px)").matches); setOpen((o) => !o); }}
          className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-brand-mid hover:bg-sky"
        >
          <IconCalendar width={18} />
        </button>
      </div>
      {bad && <p className="mt-1 text-xs text-danger">{t("invalid")}</p>}
      <AnimatePresence>
        {open && (
          <>
            {sheet && <motion.div aria-hidden className="fixed inset-0 z-[90] bg-brand-deep/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />}
            <motion.div
              id={dialogId}
              role="dialog"
              aria-label={t("dialog")}
              initial={reduce ? { opacity: 0 } : sheet ? { y: "100%" } : { opacity: 0, scale: 0.94, y: -6 }}
              animate={reduce ? { opacity: 1 } : sheet ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : sheet ? { y: "100%" } : { opacity: 0, scale: 0.96, y: -4 }}
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
              style={{ transformOrigin: "top left" }}
              className={cn(
                "z-[95] overflow-hidden bg-surface shadow-[0_24px_60px_-20px_rgb(11_31_77/0.45)]",
                sheet ? "fixed inset-x-0 bottom-0 rounded-t-[24px] pb-[env(safe-area-inset-bottom)]" : "absolute left-0 top-full mt-2 rounded-[20px] border border-line",
              )}
            >
              {sheet && <div aria-hidden className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-line" />}
              {calendar}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
