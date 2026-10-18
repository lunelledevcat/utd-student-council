"use client";

import { useState } from "react";
import { FlipCard } from "@/components/ui/FlipCard";
import { Reveal } from "@/components/ui/Reveal";
import { ImagePlaceholder } from "@/components/ui/bits";
import { cn } from "@/lib/utils";

// Public data only: name + role + grade. No phone / email / student ID.
type M = { id: string; name: string; role: string; dept: string; grade: string };

export function TeamGrid({ members }: { members: M[] }) {
  const depts = ["ทั้งหมด", ...Array.from(new Set(members.map((m) => m.dept)))];
  const [dept, setDept] = useState("ทั้งหมด");
  const shown = members.filter((m) => dept === "ทั้งหมด" || m.dept === dept);

  return (
    <div>
      <div role="group" aria-label="กรองตามฝ่าย" className="mb-8 flex flex-wrap gap-3">
        {depts.map((d) => (
          <button
            key={d}
            type="button"
            aria-pressed={dept === d}
            onClick={() => setDept(d)}
            className={cn("rounded-full border px-5 py-2 font-medium transition-colors", dept === d ? "border-brand bg-brand text-on-brand" : "border-line bg-surface hover:border-pink")}
          >
            {d}
          </button>
        ))}
      </div>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {shown.map((m, i) => (
          <Reveal as="li" key={m.id} index={i % 4}>
            <FlipCard
              label={`${m.name} ${m.role}`}
              className="h-80"
              front={
                <div className="flex h-full flex-col gap-3">
                  <ImagePlaceholder label="[รูปสมาชิก]" className="flex-1" />
                  <p className="font-display text-lg font-semibold">{m.name}</p>
                  <p className="text-sm text-muted">{m.role}</p>
                </div>
              }
              back={
                <div className="flex h-full flex-col justify-center gap-2">
                  <p className="font-display text-xl font-semibold">{m.name}</p>
                  <p>{m.role}</p>
                  <p className="text-sm text-gold">ฝ่าย{m.dept}</p>
                  <p className="text-sm">ชั้น {m.grade}</p>
                </div>
              }
            />
          </Reveal>
        ))}
      </ul>
    </div>
  );
}
