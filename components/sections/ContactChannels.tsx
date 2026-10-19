"use client";

import { useTranslations } from "next-intl";
import { ChannelLinks } from "@/components/ui/ChannelLinks";

/** Home page block with the council's official channels (links only). */
export function ContactChannels() {
  const t = useTranslations("contact");
  return (
    <section aria-labelledby="contact-h" className="mx-auto mt-10 max-w-[1320px] px-4">
      <div data-swap className="rounded-[20px] border border-line bg-surface p-5 text-ink shadow-soft md:flex md:items-center md:justify-between md:gap-6 md:p-6">
        <div>
          <h2 id="contact-h" className="font-display text-lg font-semibold text-strong">{t("title")}</h2>
          <p className="mt-0.5 text-sm text-muted">{t("lead")}</p>
        </div>
        <ChannelLinks className="mt-3 text-brand md:mt-0" />
      </div>
    </section>
  );
}
