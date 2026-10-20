import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["th", "en"],
  defaultLocale: "th",
  localePrefix: "always", // "/" -> "/th"
  // no Set-Cookie from the middleware: public pages are cached by the CDN. The language switch writes NEXT_LOCALE
  // in the browser, and proxy.ts uses it for "/".
  localeCookie: false,
});

export type Locale = (typeof routing.locales)[number];
