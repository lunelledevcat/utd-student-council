"use client";

import { useState } from "react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Reveal } from "@/components/ui/Reveal";
import { TiltCard } from "@/components/ui/TiltCard";
import { cn } from "@/lib/utils";

type Status = "done" | "in-progress" | "planned";
type Policy = { slug: string; title: string; status: Status; progress: number; category: string; desc: string };

const LABEL: Record<Status, string> = { done: "สำเร็จ", "in-progress": "กำลังทำ", planned: "วางแผน" };
const COLOR: Record<Status, string> = { done: "var(--c-done)", "in-progress": "var(--c-progress)", planned: "var(--c-planned)" };
const FILTERS: Array<{ key: "all" | Status; label: string }> = [
  { key: "all", label: "ทั้งหมด" },
  { key: "done", label: "สำเร็จ" },
  { key: "in-progress", label: "กำลังทำ" },
  { key: "planned", label: "วางแผน" },
];

/** Policy cards with status filter. `limit` trims the list on the home page. */
export function PolicyTracker({ policies, limit }: { policies: Policy[]; limit?: number }) {
  const [filter, setFilter] = useState<"all" | Status>("all");
  const shown = policies.filter((p) => filter === "all" || p.status === filter).slice(0, limit);

  return (
    <div>
      <div role="group" aria-label="กรองตามสถานะ" className="mb-8 flex flex-wrap gap-3">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            aria-pressed={filter === f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "rounded-full border px-5 py-2 font-medium transition-colors",
              filter === f.key ? "border-brand bg-brand text-on-brand" : "border-line bg-surface hover:border-pink",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
      <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" aria-live="polite">
        {shown.map((p, i) => (
          <Reveal as="li" key={p.slug} index={i % 3}>
            <TiltCard className="h-full rounded-lg border border-line bg-surface p-8 shadow-soft">
              <div className="mb-4 flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: COLOR[p.status] }} />
                  {LABEL[p.status]}
                </span>
                <span className="text-sm text-muted">{p.category}</span>
              </div>
              <h3 className="mb-2 text-xl font-semibold">{p.title}</h3>
              <p className="mb-5 text-[15px] text-muted">{p.desc}</p>
              <ProgressBar value={p.progress} color={COLOR[p.status]} />
            </TiltCard>
          </Reveal>
        ))}
      </ul>
      {shown.length === 0 && <p className="py-10 text-center text-muted">ไม่พบนโยบายในสถานะนี้</p>}
    </div>
  );
}
