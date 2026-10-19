"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { IconSearch } from "@/components/icons/Icon";
import { usePathname, useRouter } from "@/i18n/navigation";

/** Debounced (300 ms) search box that updates ?q= (and resets to page 1). */
export function ListSearch({ q, year }: { q: string; year: number }) {
  const t = useTranslations("dashboard.list");
  const router = useRouter();
  const pathname = usePathname();
  const [value, setValue] = useState(q);
  useEffect(() => {
    if (value === q) return;
    const id = setTimeout(() => router.replace({ pathname, query: { year: String(year), ...(value.trim() ? { q: value.trim() } : {}) } }), 300);
    return () => clearTimeout(id);
  }, [value, q, year, pathname, router]);
  return (
    <label className="relative block w-full sm:w-72">
      <span className="sr-only">{t("search")}</span>
      <IconSearch width={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t("searchPlaceholder")}
        className="h-10 w-full rounded-xl border border-line bg-surface pl-9 pr-3 text-sm outline-none focus:border-pink"
      />
    </label>
  );
}
