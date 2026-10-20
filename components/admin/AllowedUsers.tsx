"use client";

import { useTranslations } from "next-intl";
import { useActionState, useTransition } from "react";
import { addAllowedUser, setAllowedUser, type FormState } from "@/app/[locale]/dashboard/actions";
import { toast } from "@/components/admin/live";
import { useRouter } from "@/i18n/navigation";
import type { AllowedUser } from "@/lib/admin/users";
import { cn } from "@/lib/utils";

export function AllowedUsers({ users }: { users: AllowedUser[] }) {
  const t = useTranslations("users");
  const te = useTranslations("dashboard.errors");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [state, add, adding] = useActionState<FormState, FormData>(async (prev, fd) => {
    const r = await addAllowedUser(prev, fd);
    if (r.ok) {
      toast({ tone: "ok", text: t("saved") });
      router.refresh();
    }
    return r;
  }, { ok: false });

  const update = (email: string, patch: { active?: boolean; shared?: boolean }) =>
    start(async () => {
      const r = await setAllowedUser(email, patch);
      if (r.ok) {
        toast({ tone: "ok", text: t("saved") });
        router.refresh();
      } else toast({ tone: "error", text: te(r.error.key, r.error.values) });
    });

  const err = state.fieldErrors?.email ?? state.error;
  return (
    <div className="space-y-4">
      <form action={add} className="flex flex-wrap items-end gap-3 rounded-[20px] border border-line bg-surface p-4">
        <label className="flex min-w-[16rem] flex-1 flex-col gap-1 text-sm">
          <span className="font-medium text-muted">{t("email")}</span>
          <input name="email" type="email" required autoComplete="off" className="rounded-xl border border-line px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-muted">{t("role")}</span>
          <select name="role" defaultValue="council" className="rounded-xl border border-line px-3 py-2">
            <option value="council">{t("roles.council")}</option>
            <option value="teacher">{t("roles.teacher")}</option>
          </select>
        </label>
        <label className="flex items-center gap-2 pb-2 text-sm">
          <input type="checkbox" name="shared" className="h-4 w-4 accent-[var(--c-pink)]" />
          {t("shared")}
        </label>
        <button type="submit" disabled={adding} className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{t("add")}</button>
        {err && !state.ok && <p role="alert" className="w-full text-sm text-danger">{te(err.key, err.values)}</p>}
      </form>

      <ul className="divide-y divide-line overflow-hidden rounded-[20px] border border-line bg-surface">
        {users.length === 0 && <li className="p-4 text-sm text-muted">{t("empty")}</li>}
        {users.map((u) => (
          <li key={u.email} className="flex flex-wrap items-center gap-3 p-3">
            <div className="min-w-0 flex-1">
              <p className={cn("truncate font-semibold", u.active ? "text-strong" : "text-muted line-through")}>{u.email}</p>
              <p className="text-xs text-muted">{t(`roles.${u.role}`)} · {t("addedBy", { by: u.createdBy ?? "—" })}</p>
            </div>
            {u.shared && <span className="rounded-full bg-progress/15 px-2.5 py-0.5 text-xs font-semibold text-progress">{t("sharedBadge")}</span>}
            <button type="button" disabled={pending} onClick={() => update(u.email, { shared: !u.shared })} className="rounded-full border border-line px-3 py-1 text-xs font-semibold hover:bg-sky disabled:opacity-40">
              {t(u.shared ? "unmarkShared" : "markShared")}
            </button>
            <button
              type="button"
              role="switch"
              aria-checked={u.active}
              disabled={pending}
              onClick={() => (u.active ? confirm(t("confirmOff", { email: u.email })) && update(u.email, { active: false }) : update(u.email, { active: true }))}
              className={cn("rounded-full border px-3 py-1 text-xs font-semibold disabled:opacity-40", u.active ? "border-done bg-done/12 text-done" : "border-line hover:bg-sky")}
            >
              {t(u.active ? "active" : "inactive")}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
