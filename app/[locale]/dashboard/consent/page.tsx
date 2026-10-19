import { getTranslations, setRequestLocale } from "next-intl/server";
import { ConsentTable } from "@/components/admin/ConsentTable";
import { YearSelect } from "@/components/admin/YearSelect";
import { consentRows } from "@/lib/admin/consent";
import { yearParam } from "@/lib/admin/data";
import { requireRole } from "@/lib/auth";

/** Admin: photo consent of council members (default: awaiting). Photos appear on the site only with "yes". */
export default async function ConsentPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ year?: string }> }) {
  setRequestLocale((await params).locale);
  await requireRole(["admin"]);
  const t = await getTranslations("dashboard.consent");
  const { years, year } = await yearParam((await searchParams).year);
  const rows = await consentRows(year);
  return (
    <div className="max-w-4xl space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-strong">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted">{t("lead")}</p>
        </div>
        <YearSelect years={years} year={year} />
      </header>
      <ConsentTable year={year} rows={rows} />
    </div>
  );
}
