import { redirect } from "@/i18n/navigation";
import { requireRole } from "@/lib/auth";

export default async function AdminHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  await requireRole(["admin"]);
  return redirect({ href: "/admin/setup", locale });
}
