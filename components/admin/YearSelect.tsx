"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { ceYear } from "@/lib/utils";

/** Academic-year picker for back-office pages (?year=). */
export function YearSelect({ years, year }: { years: number[]; year: number }) {
  const t = useTranslations("year");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  return (
    <label className="flex items-center gap-2 text-sm text-muted">
      {t("label")}
      <select
        value={year}
        onChange={(e) => router.push({ pathname, query: { year: e.target.value } }, { locale })}
        className="h-10 rounded-xl border border-line bg-surface px-3 text-ink"
      >
        {years.map((y) => <option key={y} value={y}>{t("option", { be: y, ce: ceYear(y) })}</option>)}
      </select>
    </label>
  );
}
