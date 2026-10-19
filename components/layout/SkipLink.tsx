"use client";

import { useTranslations } from "next-intl";

export function SkipLink() {
  const t = useTranslations("site");
  return (
    <a href="#main" className="sr-only z-[200] rounded bg-pink px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
      {t("skip")}
    </a>
  );
}
