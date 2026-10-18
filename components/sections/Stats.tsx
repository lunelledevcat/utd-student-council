import { Counter } from "@/components/ui/Counter";
import { Reveal } from "@/components/ui/Reveal";
import { Section, SectionHead } from "@/components/ui/bits";

// [placeholder] ตัวเลขตัวอย่าง — แทนด้วยข้อมูลจริง
const STATS = [
  { value: 24, label: "โครงการที่ทำแล้ว" },
  { value: 12, label: "นโยบายที่สำเร็จ" },
  { value: 386, label: "ความคิดเห็นที่ได้รับ" },
  { value: 18, label: "กิจกรรมที่จัด" },
];

export function Stats() {
  return (
    <Section tone="surface">
      <SectionHead title="สภาของเราในตัวเลข" sub="[ตัวเลขตัวอย่าง — ใส่ข้อมูลจริง]" />
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((s, i) => (
          <Reveal as="li" key={s.label} index={i} className="rounded-lg border border-line bg-page p-8">
            <span aria-hidden className="mb-3 block h-[3px] w-12 bg-gold" />
            <p className="font-serif text-6xl font-bold text-brand dark:text-on-brand" style={{ fontFamily: "var(--font-noto-serif)" }}>
              <Counter value={s.value} />
            </p>
            <p className="mt-2 font-medium text-muted">{s.label}</p>
          </Reveal>
        ))}
      </ul>
    </Section>
  );
}
