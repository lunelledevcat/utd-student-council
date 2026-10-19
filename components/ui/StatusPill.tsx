"use client";

import { useTranslations } from "next-intl";
import type { PolicyStatus } from "@/lib/content";
import { cn } from "@/lib/utils";

const TONE: Record<PolicyStatus, string> = {
  done: "bg-done/12 text-done ring-done/30",
  "in-progress": "bg-progress/12 text-progress ring-progress/30",
  planned: "bg-planned/15 text-muted ring-planned/30",
};

export function StatusPill({ status, className }: { status: PolicyStatus; className?: string }) {
  const t = useTranslations("policy.status");
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1", TONE[status], className)}>
      <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full bg-current", status === "in-progress" && "animate-pulse")} />
      {t(status)}
    </span>
  );
}
