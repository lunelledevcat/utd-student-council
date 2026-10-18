import { Reveal } from "@/components/ui/Reveal";
import { Section, SectionHead } from "@/components/ui/bits";
import { cn } from "@/lib/utils";

// [placeholder] รูปกิจกรรม — ใส่รูปจริงด้วย next/image แล้วคงลายน้ำโลโก้สภา
const TILES = [
  { label: "กีฬาสี", cls: "row-span-2 bg-brand-mid text-on-brand" },
  { label: "วันสำคัญ", cls: "bg-pink-soft text-ink" },
  { label: "ดนตรี", cls: "bg-brand text-on-brand" },
  { label: "วิชาการ", cls: "row-span-2 bg-pink-soft text-ink" },
  { label: "ค่ายอาสา", cls: "bg-brand text-on-brand" },
  { label: "เลือกตั้งสภา", cls: "bg-pink-soft text-ink" },
];

export function Gallery() {
  return (
    <Section>
      <SectionHead title="แกลเลอรีกิจกรรม" sub="ภาพบรรยากาศจากกิจกรรมของสภา [ใส่รูปจริง]" />
      <ul className="grid auto-rows-[200px] grid-cols-2 gap-4 lg:grid-cols-4 lg:auto-rows-[270px]">
        {TILES.map((t, i) => (
          <Reveal as="li" key={t.label} index={i % 4} className={cn("group relative overflow-hidden rounded-lg", t.cls)}>
            <div className="no-select absolute inset-0 transition-transform duration-500 group-hover:scale-105" style={{ transitionTimingFunction: "var(--ease-out)" }} />
            <span className="absolute bottom-4 left-4 rounded-full bg-surface px-3 py-1 text-sm font-medium text-ink">{t.label}</span>
          </Reveal>
        ))}
      </ul>
    </Section>
  );
}
