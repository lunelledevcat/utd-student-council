import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { EntityForm } from "@/components/admin/EntityForm";
import { Link } from "@/i18n/navigation";
import { getRowForForm, yearParam } from "@/lib/admin/data";
import { isEntity } from "@/lib/admin/entities";
import { MEMBERS, STAFF, requireRole } from "@/lib/auth";

type Props = { params: Promise<{ locale: string; entity: string; id: string }>; searchParams: Promise<{ year?: string }> };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** New (`/new`) or edit form for one item. */
export default async function EntityEdit({ params, searchParams }: Props) {
  const [{ locale, entity, id }, sp] = await Promise.all([params, searchParams]);
  if (!isEntity(entity) || (id !== "new" && !UUID.test(id))) notFound();
  setRequestLocale(locale);
  const s = await requireRole(MEMBERS);
  const t = await getTranslations("dashboard");
  const loaded = id === "new" ? null : await getRowForForm(entity, id);
  if (id !== "new" && !loaded) notFound();
  const { year: picked } = await yearParam(sp.year);
  const year = loaded ? Number(loaded.row.year) : picked;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href={{ pathname: `/dashboard/${entity}`, query: { year: String(year) } }} className="text-sm text-muted hover:text-pink-ink">← {t("form.back")}</Link>
      <h1 className="text-2xl font-bold text-strong">{t(id === "new" ? "form.newTitle" : "form.editTitle", { entity: t(`entities.${entity}`) })}</h1>
      {!STAFF.includes(s.role) && <p className="rounded-xl bg-sky px-4 py-3 text-sm text-ink">{t("form.reviewNote")}</p>}
      <EntityForm entity={entity} id={id === "new" ? null : id} year={year} locale={locale} row={loaded?.row ?? {}} media={loaded?.media ?? {}} />
    </div>
  );
}
