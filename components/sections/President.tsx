import { Reveal } from "@/components/ui/Reveal";
import { ImagePlaceholder, Section, SectionHead } from "@/components/ui/bits";
import { SITE } from "@/lib/site";

/** Profile card laid out like the reference's profile modal: photo 5/12, details 7/12. */
export function President() {
  return (
    <Section>
      <SectionHead title="สารจากประธานสภานักเรียน" />
      <div className="grid items-center gap-6 rounded-lg border border-line bg-surface p-5 shadow-soft md:grid-cols-12 md:gap-8 md:p-8">
        <Reveal className="md:col-span-5">
          <ImagePlaceholder label="[รูปประธานสภา]" className="mx-auto aspect-[3/4] w-full max-w-sm rounded-lg" />
        </Reveal>
        <Reveal className="space-y-6 md:col-span-7">
          <blockquote className="font-serif text-xl leading-[1.7] md:text-[26px]" style={{ fontFamily: "var(--font-noto-serif)" }}>
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
