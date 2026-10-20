"use client";

import { useTranslations } from "next-intl";
import { IconFacebook, IconInstagram, IconTiktok } from "@/components/icons/Icon";
import { CHANNELS } from "@/lib/contact";

const ICON = { facebook: IconFacebook, instagram: IconInstagram, tiktok: IconTiktok };

/**
 * Desktop header buttons for the council's channels (lib/contact.ts CHANNELS; phones use the MobileDock).
 * Plain outbound links: new tab, rel="noopener noreferrer nofollow"; nothing is loaded from the platforms.
 */
export function ChannelLinks() {
  const t = useTranslations("contact");
  return (
    <ul className="flex flex-wrap gap-2">
      {CHANNELS.map((c) => {
        const I = ICON[c.key];
        return (
          <li key={c.key}>
            <a
              href={c.href}
              target="_blank"
              rel="noopener noreferrer nofollow"
              aria-label={`${t(c.key)}: ${c.label} ${t("opens")}`}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 text-sm font-medium transition duration-300 hover:-translate-y-0.5 hover:border-pink-400/70 hover:bg-white/10 hover:shadow-glow"
            >
              <I width={17} height={17} />
              <span className="hidden lg:inline">{t(c.key)}</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
