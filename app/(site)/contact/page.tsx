import type { Metadata } from "next";
import { Reveal } from "@/components/ui/Reveal";
import { PageHero, Section } from "@/components/ui/bits";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "ติดต่อ", description: `ช่องทางติดต่อสภานักเรียน ${SITE.address}` };

const MAP_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${SITE.school} ${SITE.address}`)}`;

export default function ContactPage() {
  return (
    <>
      <PageHero title="ติดต่อ" sub="ช่องทางติดต่อสภานักเรียน" />
      <Section>
        <div className="grid gap-10 lg:grid-cols-2">
          <Reveal className="space-y-6">
            <div>
              <h2 className="mb-1 text-[28px] font-semibold">{SITE.school}</h2>
              <p className="text-muted">{SITE.address}</p>
            </div>
            <dl className="space-y-4">
              <div><dt className="font-medium">ห้องสภานักเรียน</dt><dd className="text-muted">[อาคาร / ห้อง — ใส่ข้อมูลจริง]</dd></div>
              <div><dt className="font-medium">เวลาทำการ</dt><dd className="text-muted">[วัน-เวลา — ใส่ข้อมูลจริง]</dd></div>
              {SITE.social.map((s) => (
                <div key={s.label}><dt className="font-medium">{s.label}</dt><dd className="text-muted">[ลิงก์ — ใส่ข้อมูลจริง]</dd></div>
              ))}
            </dl>
            <a href={MAP_URL} target="_blank" rel="noopener noreferrer" className="inline-block rounded-full bg-pink px-8 py-3.5 font-display text-lg font-semibold text-white hover:shadow-glow">
              เปิดแผนที่ใน Google Maps
            </a>
          </Reveal>
          <Reveal index={1}>
            <div role="img" aria-label="[แผนที่โรงเรียน]" className="grid aspect-[4/3] place-items-center rounded-lg border border-line bg-pink-soft text-center text-muted">
              [แผนที่ — ฝังแผนที่จริงเมื่อพร้อม และเพิ่ม frame-src ใน CSP]
            </div>
          </Reveal>
        </div>
      </Section>
    </>
  );
}
