import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["th", "en"],
  defaultLocale: "th",
  localePrefix: "always", // "/" -> "/th"
  localeCookie: { name: "NEXT_LOCALE", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" },
});

export type Locale = (typeof routing.locales)[number];
