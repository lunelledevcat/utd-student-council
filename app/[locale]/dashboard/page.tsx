import { getTranslations, setRequestLocale } from "next-intl/server";
import { YearSelect } from "@/components/admin/YearSelect";
import { Link } from "@/i18n/navigation";
import { counts, yearParam } from "@/lib/admin/data";
import { ENTITY_KEYS } from "@/lib/admin/entities";
import { MEMBERS, requireRole } from "@/lib/auth";
import { ceYear } from "@/lib/utils";

export default async function DashboardHome({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ year?: string; denied?: string }> }) {
  const [{ locale }, sp] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);
  await requireRole(MEMBERS);
  const t = await getTranslations("dashboard");
  const { years, year } = await yearParam(sp.year);
  const c = await counts(year);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-strong">{t("overview.heading")}</h1>
          <p className="text-sm text-muted">{t("overview.sub", { be: year, ce: ceYear(year) })}</p>
        </div>
        <YearSelect years={years} year={year} />
      </header>
      {sp.denied && <p role="alert" className="rounded-xl border border-danger/30 bg-pink-soft px-4 py-3 text-sm text-danger">{t("overview.denied")}</p>}
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {ENTITY_KEYS.map((k) => (
          <li key={k}>
            <Link
              href={{ pathname: `/dashboard/${k}`, query: { year: String(year) } }}
              className="block h-full rounded-[20px] border border-line bg-surface p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift"
            >
              <p className="font-display text-lg font-semibold text-strong">{t(`entities.${k}`)}</p>
              <p className="mt-2 flex flex-wrap gap-2 text-sm">
                <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-muted">{t("overview.total", { n: c[k].total })}</span>
                {c[k].pending > 0 && <span className="rounded-full bg-progress/15 px-2.5 py-0.5 font-medium text-progress">{t("overview.pending", { n: c[k].pending })}</span>}
              </p>
              <p className="mt-3 text-sm font-medium text-pink-ink">{t("overview.manage")} →</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
