"use client";

import { useTranslations } from "next-intl";
import { IconFacebook, IconInstagram, IconTiktok } from "@/components/icons/Icon";
import { CHANNELS } from "@/lib/site";
import { cn } from "@/lib/utils";

const ICON = { facebook: IconFacebook, instagram: IconInstagram, tiktok: IconTiktok };

/**
 * The council's official channels (lib/site.ts CHANNELS). Plain outbound links: new tab,
 * rel="noopener noreferrer nofollow"; nothing is loaded from the platforms.
 * variant "pill" = compact header buttons, "card" = labelled blocks (footer / home page).
 */
export function ChannelLinks({ variant = "card", className }: { variant?: "pill" | "card"; className?: string }) {
  const t = useTranslations("contact");
  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      {CHANNELS.map((c) => {
        const I = ICON[c.key];
        return (
          <li key={c.key}>
            <a
              href={c.href}
              target="_blank"
              rel="noopener noreferrer nofollow"
              aria-label={`${t(c.key)}: ${c.label} ${t("opens")}`}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border transition duration-300 hover:-translate-y-0.5",
                variant === "pill"
                  ? "h-9 border-white/20 bg-white/5 px-2.5 text-sm font-medium hover:border-pink-400/70 hover:bg-white/10 hover:shadow-glow sm:h-10 sm:px-3"
                  : "border-current/20 px-3.5 py-2 text-sm hover:shadow-glow",
              )}
            >
              <I width={17} height={17} />
              <span className={variant === "pill" ? "hidden lg:inline" : undefined}>
                {variant === "pill" ? t(c.key) : <><span className="font-semibold">{t(c.key)}</span> <span className="opacity-80">{c.label}</span></>}
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
