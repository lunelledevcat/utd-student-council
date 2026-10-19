"use client";

import { useTranslations } from "next-intl";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { Illustration } from "@/components/icons/Illustration";
import { Petals } from "@/components/ui/Petals";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("notFound");
  return (
    <>
      <Navbar />
      <main className="relative isolate grid min-h-[calc(100dvh-72px)] place-items-center overflow-hidden bg-gradient-to-br from-brand-deep to-brand-mid px-4 text-center text-on-brand">
        <Petals />
        <div data-swap className="relative space-y-5">
          <Illustration name="404" className="mx-auto h-40 w-auto md:h-52" />
          <p className="font-serif text-6xl font-bold text-gold">404</p>
          <h1 className="text-4xl font-bold">{t("title")}</h1>
          <p className="text-pink-soft">{t("sub")}</p>
          <Link href="/" className="inline-block rounded-full bg-pink px-8 py-3.5 font-display text-lg font-semibold text-white hover:shadow-glow">{t("home")}</Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
