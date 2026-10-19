"use client";

import { useTranslations } from "next-intl";

/**
 * Generic error page. In production Next.js strips the real message from server errors and gives a `digest`; the same
 * digest is printed in the server log next to the full error, so the reference code lets an admin find it.
 */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("errorPage");
  const ref = error.digest ?? "—";
  return (
    <main className="mx-auto grid min-h-[60dvh] max-w-lg place-items-center px-4 text-center">
      <div>
        <h1 className="font-display text-2xl font-semibold">{t("title")}</h1>
        <p className="mt-3 text-muted">{t("body")}</p>
        <p className="mt-4 text-sm">
          {t("ref")}: <code className="rounded bg-surface-2 px-2 py-0.5 font-mono">{ref}</code>
        </p>
        <button type="button" onClick={reset} className="mt-6 rounded-full bg-brand px-5 py-2.5 font-semibold text-on-brand">
          {t("retry")}
        </button>
      </div>
    </main>
  );
}
