import { Reveal } from "@/components/ui/Reveal";
import { ImagePlaceholder, Section } from "@/components/ui/bits";
import { SITE } from "@/lib/site";

export function President() {
  return (
    <Section>
      <div className="grid items-center gap-10 md:grid-cols-[420px_1fr] md:gap-16">
        <Reveal>
          <ImagePlaceholder label="[รูปประธานสภา]" className="aspect-[7/8] w-full rounded-lg" />
        </Reveal>
        <Reveal className="space-y-6">
          <p className="font-medium text-pink">สารจากประธานสภานักเรียน</p>
          <blockquote className="font-serif text-2xl leading-[1.7] md:text-[28px]" style={{ fontFamily: "var(--font-noto-serif)" }}>
            “[คำกล่าวของประธานสภานักเรียน — ใส่ข้อความจริง]”
          </blockquote>
          <div>
            <p className="font-display text-xl font-semibold">[ชื่อ-นามสกุล]</p>
            <p className="text-muted">ประธานสภานักเรียน · วาระปี {SITE.term}</p>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
