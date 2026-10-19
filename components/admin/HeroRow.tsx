"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { setHero } from "@/app/[locale]/dashboard/actions";
import { useRouter } from "@/i18n/navigation";

type P = { id: string; caption: string; isHero: boolean; order: number; url: string };

export function HeroRow({ photo }: { photo: P }) {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const [on, setOn] = useState(photo.isHero);
  const [order, setOrder] = useState(photo.order);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  return (
    <li className="overflow-hidden rounded-[20px] border border-line bg-surface shadow-soft">
      {/* eslint-disable-next-line @next/next/no-img-element -- approved variant from the public bucket */}
      <img src={photo.url} alt={photo.caption} className="aspect-[16/9] w-full object-cover" />
      <div className="flex flex-wrap items-center gap-3 p-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={on} onChange={(e) => setOn(e.target.checked)} className="h-5 w-5 accent-[var(--c-pink)]" />
          {t("hero.show")}
        </label>
        <label className="flex items-center gap-2">
          {t("hero.order")}
          <input type="number" min={0} max={999} value={order} onChange={(e) => setOrder(Number(e.target.value))} className="w-20 rounded-lg border border-line px-2 py-1" />
        </label>
        <button
          type="button"
          disabled={pending}
          onClick={() => start(async () => {
            const r = await setHero(photo.id, on, order);
            setMsg(r.ok ? { ok: true, text: t("hero.saved") } : { ok: false, text: t(`errors.${r.error.key}`, r.error.values) });
            if (r.ok) router.refresh();
          })}
          className="ml-auto rounded-full bg-brand px-4 py-1.5 font-semibold text-white disabled:opacity-50"
        >
          {t("hero.save")}
        </button>
        {msg && <p role={msg.ok ? "status" : "alert"} className={msg.ok ? "w-full text-done" : "w-full text-danger"}>{msg.text}</p>}
      </div>
    </li>
  );
}
