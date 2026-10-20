import { getTranslations, setRequestLocale } from "next-intl/server";
import { AllowedUsers } from "@/components/admin/AllowedUsers";
import { listAllowed } from "@/lib/admin/users";
import { requireRole } from "@/lib/auth";

/** Admin: who may use the back office and with which role (ADMIN_EMAILS aside). */
export default async function UsersPage({ params }: { params: Promise<{ locale: string }> }) {
  setRequestLocale((await params).locale);
  await requireRole(["admin"]);
  const t = await getTranslations("users");
  const users = await listAllowed();
  return (
    <div className="max-w-4xl space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-strong">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("lead")}</p>
      </header>
      <AllowedUsers users={users} />
    </div>
  );
}
