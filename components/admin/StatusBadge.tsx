import { useTranslations } from "next-intl";
import type { ReviewStatus } from "@/lib/admin/entities";
import { cn } from "@/lib/utils";

const TONE: Record<ReviewStatus, string> = {
  pending: "bg-progress/15 text-progress",
  approved: "bg-done/12 text-done",
  rejected: "bg-danger/10 text-danger",
  hidden: "bg-planned/20 text-muted",
};

export function StatusBadge({ status }: { status: ReviewStatus }) {
  const t = useTranslations("dashboard.status");
  return <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold", TONE[status])}>{t(status)}</span>;
}
