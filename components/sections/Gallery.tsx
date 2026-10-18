import { Reveal } from "@/components/ui/Reveal";
import { Section, SectionHead } from "@/components/ui/bits";

// [placeholder] รูปกิจกรรม — ใส่รูปจริงด้วย next/image (สัดส่วน 16:5) แล้วคงลายน้ำโลโก้สภา
const TILES = [
  { label: "กีฬาสี", cls: "bg-brand-mid text-on-brand" },
  { label: "วันสำคัญ", cls: "bg-pink-soft text-ink" },
  { label: "ดนตรี", cls: "bg-brand text-on-brand" },
];

/** Reference "activity wrapper": full-width 16:5 image with a centred title bar, stacked. */
export function Gallery() {
  return (
    <Section>
      <SectionHead title="ภาพผลงานและกิจกรรม" sub="ภาพบรรยากาศจากกิจกรรมของสภา [ใส่รูปจริง]" />
      <ul className="space-y-6 md:space-y-8">
        {TILES.map((t) => (
          <Reveal as="li" key={t.label}>
            <figure className="group overflow-hidden rounded-lg border border-line bg-surface shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-glow">
              <div className={`relative aspect-[16/7] overflow-hidden md:aspect-[16/5] ${t.cls}`}>
                <div className="no-select absolute inset-0 transition-transform duration-500 group-hover:scale-105" style={{ transitionTimingFunction: "var(--ease-out)" }} />
              </div>
              <figcaption className="border-t border-line px-5 py-4 text-center font-medium">{t.label}</figcaption>
            </figure>
          </Reveal>
        ))}
      </ul>
    </Section>
  );
}
