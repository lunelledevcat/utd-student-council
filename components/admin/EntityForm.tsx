"use client";

import { motion, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { saveEntity, type FormState } from "@/app/[locale]/dashboard/actions";
import { ImageField, ImagesField } from "@/components/admin/PhotoFields";
import type { FormPhoto } from "@/lib/admin/data";
import { ENTITIES, type EntityKey, type Field } from "@/lib/admin/entities";
import { cn } from "@/lib/utils";

const INPUT = "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-ink outline-none transition focus:border-pink aria-[invalid=true]:border-danger";
type Lang = "th" | "en";

/**
 * Form generated from lib/admin/entities. Translatable fields have a Thai and an English input; the tab bar only
 * toggles which one is visible — both stay in the DOM so both are submitted.
 */
export function EntityForm({
  entity, id, year, locale, row, media,
}: { entity: EntityKey; id: string | null; year: number; locale: string; row: Record<string, unknown>; media: Record<string, FormPhoto[]> }) {
  const t = useTranslations("dashboard");
  const reduce = useReducedMotion();
  const e = ENTITIES[entity];
  const [lang, setLang] = useState<Lang>("th");
  const [state, action, pending] = useActionState<FormState, FormData>(saveEntity.bind(null, entity, id, year, locale), { ok: false });
  const hasEn = e.fields.some((f) => ("en" in f && f.en) || f.kind === "timeline");
  const err = (name: string) => {
    const x = state.fieldErrors?.[name];
    return x ? t(`errors.${x.key}`, x.values) : null;
  };
  const label = (f: Field) => t(`fields.${entity}.${f.name}`);
  const hint = (f: Field) => (f.hint ? t(`hints.${entity}.${f.name}`) : null);
  const val = (name: string) => (row[name] ?? "") as string;

  const timelineText = (en: boolean) =>
    Array.isArray(row.timeline)
      ? (row.timeline as { date: string; text: string; text_en?: string }[]).map((s) => (en ? s.text_en ?? "" : `${s.date} | ${s.text}`)).join("\n")
      : "";

  function control(f: Field, name: string, lng: Lang) {
    const common = { id: name, name, "aria-invalid": !!err(name), "aria-describedby": `${name}-msg`, lang: lng };
    switch (f.kind) {
      case "text":
        return <input {...common} type="text" defaultValue={val(name)} maxLength={f.max} required={f.required && lng === "th"} className={INPUT} />;
      case "textarea":
        return <textarea {...common} defaultValue={val(name)} maxLength={f.max} rows={f.rows ?? 4} required={f.required && lng === "th"} className={INPUT} />;
      case "date":
        return <input {...common} type="date" defaultValue={val(name)} required={f.required} className={INPUT} />;
      case "url":
        return <input {...common} type="url" inputMode="url" placeholder="https://" defaultValue={val(name)} className={INPUT} />;
      case "number":
        return <input {...common} type="number" min={f.min} max={f.max} defaultValue={String(row[name] ?? f.min)} className={cn(INPUT, "max-w-40")} />;
      case "select":
        return (
          <select {...common} defaultValue={val(name) || f.options[0]} className={INPUT}>
            {f.options.map((o) => <option key={o} value={o}>{t(`options.${f.name}.${o}`)}</option>)}
          </select>
        );
      case "timeline":
        return <textarea {...common} defaultValue={timelineText(lng === "en")} rows={5} className={cn(INPUT, "font-mono text-sm")} />;
      default:
        return null;
    }
  }

  return (
    <form action={action} className="space-y-5 rounded-[20px] border border-line bg-surface p-5 shadow-soft md:p-7" noValidate>
      {hasEn && (
        <div className="sticky top-2 z-10 -mx-1 rounded-2xl bg-surface/90 p-1 backdrop-blur">
          <div role="tablist" aria-label={t("form.langTabs")} className="relative grid w-fit grid-cols-2 rounded-xl bg-surface-2 p-1">
            <motion.span
              aria-hidden
              className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-lg bg-brand shadow"
              animate={{ x: lang === "th" ? "0%" : "100%" }}
              transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 35 }}
            />
            {(["th", "en"] as Lang[]).map((l) => (
              <button
                key={l}
                type="button"
                role="tab"
                aria-selected={lang === l}
                onClick={() => setLang(l)}
                className={cn("relative z-10 px-5 py-1.5 text-sm font-semibold transition-colors", lang === l ? "text-white" : "text-muted hover:text-ink")}
              >
                {t(`form.${l}`)}
              </button>
            ))}
          </div>
          {lang === "en" && <p className="mt-2 px-1 text-xs text-muted">{t("form.enNote")}</p>}
        </div>
      )}

      {e.fields.map((f) => {
        if (f.kind === "image" || f.kind === "images") {
          const Comp = f.kind === "image" ? ImageField : ImagesField;
          return (
            <div key={f.name} className="space-y-1.5">
              <p className="text-sm font-medium text-ink">{label(f)}</p>
              <Comp name={f.name} initial={media[f.name] ?? []} portrait={f.kind === "image" && f.portrait} />
              <p id={`${f.name}-msg`} className="text-xs text-danger">{err(f.name)}</p>
            </div>
          );
        }
        if (f.kind === "checkbox") {
          return (
            <div key={f.name}>
              <label className="flex items-start gap-3">
                <input type="checkbox" name={f.name} defaultChecked={!!row[f.name]} className="mt-1 h-5 w-5 accent-[var(--c-pink)]" />
                <span>
                  <span className="text-sm font-medium text-ink">{label(f)}</span>
                  {hint(f) && <span className="block text-xs text-muted">{hint(f)}</span>}
                </span>
              </label>
            </div>
          );
        }
        const bilingual = ("en" in f && f.en) || f.kind === "timeline";
        return (
          <div key={f.name} className="space-y-3">
            {(bilingual ? (["th", "en"] as Lang[]) : (["th"] as Lang[])).map((l) => {
              const name = l === "en" ? `${f.name}_en` : f.name;
              const visible = !bilingual || l === lang;
              return (
                <div key={l} className={cn("space-y-1.5", !visible && "hidden")}>
                  <label htmlFor={name} className="flex items-center gap-2 text-sm font-medium text-ink">
                    {l === "en" ? (f.kind === "timeline" ? t("form.timelineEn") : t("form.enOf", { label: label(f) })) : label(f)}
                    {"required" in f && f.required && l === "th" && <span className="text-xs font-normal text-pink-ink">{t("form.required")}</span>}
                  </label>
                  {control(f, name, l)}
                  {(l === "th" ? hint(f) : f.kind === "timeline" ? t("form.timelineEnHint") : null) && (
                    <p className="text-xs text-muted">{l === "th" ? hint(f) : t("form.timelineEnHint")}</p>
                  )}
                  <p id={`${name}-msg`} className="text-xs text-danger">{err(name)}</p>
                </div>
              );
            })}
          </div>
        );
      })}

      {state.error && <p role="alert" className="rounded-xl bg-pink-soft px-4 py-3 text-sm text-danger">{t(`errors.${state.error.key}`, state.error.values)}</p>}
      <button type="submit" disabled={pending} className="w-full rounded-full bg-pink px-6 py-3 font-display text-lg font-semibold text-white transition hover:shadow-glow disabled:opacity-60 sm:w-auto">
        {pending ? t("form.saving") : t("form.save")}
      </button>
    </form>
  );
}
