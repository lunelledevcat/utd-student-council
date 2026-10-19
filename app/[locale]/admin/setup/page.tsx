import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireRole } from "@/lib/auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { BINDINGS, ENV_VARS, envStatus, type EnvStatus } from "@/lib/env-spec";
import { cn } from "@/lib/utils";

type Status = EnvStatus | "unknown";
const BADGE: Record<Status, string> = { set: "✅", test: "⚠️", missing: "❌", unknown: "❔" };
const TONE: Record<Status, string> = {
  set: "bg-done/12 text-done", test: "bg-progress/15 text-progress", missing: "bg-danger/10 text-danger", unknown: "bg-surface-2 text-muted",
};

/** A binding from wrangler.jsonc is present on this Worker (resource exists and is bound). */
function bindingStatus(name: (typeof BINDINGS)[number]): Status {
  try {
    return (getCloudflareContext().env as unknown as Record<string, unknown>)[name] ? "set" : "missing";
  } catch {
    return "unknown";
  }
}

/**
 * Configuration status for administrators. Only a status per variable is rendered — values never leave the server
 * (this is a server component; nothing but the status string and help text is sent to the browser).
 */
export default async function SetupPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireRole(["admin"]);
  const t = await getTranslations("setup");
  const rows = ENV_VARS.map((v) => ({ v, status: envStatus(v) as Status }));

  // plain render helper (not a component), keyed by the caller
  const row = ({ name, status, url, need, pub }: { name: string; status: Status; url?: string; need?: "required" | "optional"; pub?: boolean }) => (
    <li key={name} className="rounded-[20px] border border-line bg-surface p-5 shadow-soft">
      <div className="flex flex-wrap items-center gap-2">
        <code className="rounded-lg bg-surface-2 px-2 py-0.5 font-mono text-sm font-semibold text-strong">{name}</code>
        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", TONE[status])}>{BADGE[status]} {t(`status.${status}`)}</span>
        {need && <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs text-muted">{t(`need.${need}`)}</span>}
        {pub !== undefined && <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs text-muted">{t(pub ? "exposure.public" : "exposure.secret")}</span>}
      </div>
      <dl className="mt-3 grid gap-1.5 text-sm sm:grid-cols-[10rem_1fr]">
        <dt className="font-medium text-muted">{t("labels.purpose")}</dt><dd>{t.raw(`vars.${name}.purpose`) as string}</dd>
        <dt className="font-medium text-muted">{t("labels.where")}</dt>
        <dd className="break-words">
          {t.raw(`vars.${name}.where`) as string}
          {url && <> — <a href={url} target="_blank" rel="noopener noreferrer nofollow" className="font-medium text-pink-ink underline-offset-4 hover:underline">{t("labels.open")} ↗</a></>}
        </dd>
        {status !== "set" && (
          <>
            <dt className="font-medium text-muted">{t("labels.missingDev")}</dt><dd>{t.raw(`vars.${name}.missingDev`) as string}</dd>
            <dt className="font-medium text-muted">{t("labels.missingProd")}</dt><dd>{t.raw(`vars.${name}.missingProd`) as string}</dd>
          </>
        )}
      </dl>
    </li>
  );

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-strong">{t("title")}</h1>
        <p className="text-sm text-muted">{t("sub")}</p>
        <p className="mt-1 text-xs text-muted">{t("mode", { mode: process.env.NODE_ENV ?? "?" })} · {t("restart")}</p>
      </header>
      <ul className="space-y-3">
        {rows.map(({ v, status }) => row({ name: v.name, status, url: v.url, need: v.need, pub: v.public }))}
      </ul>
      <h2 className="pt-2 text-lg font-semibold text-strong">{t("bindingsTitle")}</h2>
      <ul className="grid gap-2 sm:grid-cols-2">
        {BINDINGS.map((b) => {
          const st = bindingStatus(b);
          return (
            <li key={b} className="flex items-center gap-2 rounded-2xl border border-line bg-surface px-4 py-3 text-sm">
              <code className="font-mono font-semibold">{b}</code>
              <span className="flex-1 text-muted">{t(`bindings.${b}`)}</span>
              <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", TONE[st])}>{BADGE[st]} {t(`status.${st}`)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
