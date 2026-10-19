import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { RowActions } from "@/components/admin/RowActions";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { YearSelect } from "@/components/admin/YearSelect";
import { Link } from "@/i18n/navigation";
import { listRows, yearParam } from "@/lib/admin/data";
import { isEntity } from "@/lib/admin/entities";
import { MEMBERS, STAFF, requireRole } from "@/lib/auth";

type Props = { params: Promise<{ locale: string; entity: string }>; searchParams: Promise<{ year?: string; saved?: string }> };

export default async function EntityList({ params, searchParams }: Props) {
  const [{ locale, entity }, sp] = await Promise.all([params, searchParams]);
  if (!isEntity(entity)) notFound();
  setRequestLocale(locale);
  const s = await requireRole(MEMBERS);
  const t = await getTranslations("dashboard");
  const { years, year } = await yearParam(sp.year);
  const rows = await listRows(entity, year, s.id);
  const staff = STAFF.includes(s.role);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold text-strong">{t(`entities.${entity}`)}</h1>
        <div className="flex flex-wrap items-center gap-3">
          <YearSelect years={years} year={year} />
          <Link
            href={{ pathname: `/dashboard/${entity}/new`, query: { year: String(year) } }}
            className="rounded-full bg-pink px-5 py-2.5 font-display font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-glow"
          >
            + {t("list.new")}
          </Link>
        </div>
      </header>
      {sp.saved && (
        <p role="status" className="rounded-xl border border-done/30 bg-done/10 px-4 py-3 text-sm text-done">{staff ? t("list.saved") : t("list.savedPending")}</p>
      )}

      {rows.length === 0 ? (
        <p className="rounded-[20px] border border-dashed border-line bg-surface p-8 text-center text-muted">{t("list.empty")}</p>
      ) : (
        <div className="overflow-hidden rounded-[20px] border border-line bg-surface shadow-soft">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-2 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th scope="col" className="px-4 py-3">{t("list.columns.title")}</th>
                <th scope="col" className="hidden px-4 py-3 sm:table-cell">{t("list.columns.status")}</th>
                <th scope="col" className="px-4 py-3 text-right">{t("list.columns.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.id} className="align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium text-strong">{r.title}</p>
                    <p className="text-xs text-muted">
                      {r.sub}
                      {r.titleEn !== null ? ` · ${r.titleEn}` : ""}
                    </p>
                    {r.titleEn === null && (
                      <span className="mt-1 inline-block rounded bg-surface-2 px-1.5 py-0.5 text-[0.7rem] text-muted">{t("list.noEnglish")}</span>
                    )}
                    <div className="mt-1 sm:hidden"><StatusBadge status={r.status} /></div>
                    {r.status === "rejected" && r.reason && <p className="mt-1 text-xs text-danger">{t("list.reason", { reason: r.reason })}</p>}
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3">
                    <RowActions
                      entity={entity}
                      id={r.id}
                      status={r.status}
                      canReview={staff}
                      canDelete={staff || (r.mine && r.status === "pending")}
                      canEdit={staff || (r.mine && (r.status === "pending" || r.status === "rejected"))}
                      editHref={`/dashboard/${entity}/${r.id}?year=${year}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
