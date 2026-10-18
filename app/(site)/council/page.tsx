import type { Metadata } from "next";
import { Timeline } from "@/components/sections/Timeline";
import { FlipCard } from "@/components/ui/FlipCard";
import { Reveal } from "@/components/ui/Reveal";
import { PageHero, Section, SectionHead } from "@/components/ui/bits";
import { getAlbums } from "@/lib/content";

export const metadata: Metadata = { title: "สภานักเรียน", description: "สภานักเรียนโรงเรียนอุตรดิตถ์ วิสัยทัศน์ พันธกิจ โครงสร้าง และประวัติโรงเรียน" };

const SYMBOLS = [
  { title: "ตราโรงเรียน", icon: "🏛", body: "[ความหมายของตราโรงเรียน — ใส่ข้อมูลจริง]" },
  { title: "สีประจำโรงเรียน", icon: "◐", body: "น้ำเงิน–ชมพู · [ความหมายของสี — ใส่ข้อมูลจริง]" },
  { title: "ต้นแคฝรั่ง", icon: "✿", body: "ต้นไม้ประจำโรงเรียน ดอกสีชมพู · [ความหมาย — ใส่ข้อมูลจริง]" },
];
const ORG = ["ประธานสภา", "รองประธาน", "เลขานุการ", "เหรัญญิก", "ฝ่ายกิจกรรม", "ฝ่ายวิชาการ", "ฝ่ายประชาสัมพันธ์", "ฝ่ายสวัสดิการ"];

export default async function CouncilPage() {
  const albums = await getAlbums();
  return (
    <>
      <PageHero title="สภานักเรียน" sub="เสียงของนักเรียน อ.ต. — [สโลแกน]" />
      <Section>
        <div className="grid gap-10 md:grid-cols-3">
          {[
            ["สภานักเรียนคืออะไร", "[คำอธิบายบทบาทของสภานักเรียน — ใส่ข้อความจริง]"],
            ["วิสัยทัศน์", "[วิสัยทัศน์ — ใส่ข้อความจริง]"],
            ["พันธกิจ", "[พันธกิจ — ใส่ข้อความจริง]"],
          ].map(([t, b], i) => (
            <Reveal key={t} index={i} className="space-y-3">
              <h2 className="text-[28px] font-semibold">{t}</h2>
              <p className="text-muted">{b}</p>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section tone="surface">
        <SectionHead title="โครงสร้างสภา" sub="[ปรับตามโครงสร้างจริง]" />
        <Reveal className="space-y-6">
          <div className="mx-auto w-fit rounded-md bg-brand px-8 py-3 text-center font-display text-lg font-semibold text-on-brand">{ORG[0]}</div>
          <div aria-hidden className="mx-auto h-6 w-px bg-line" />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ORG.slice(1).map((o) => (
              <li key={o} className="rounded-md border border-line bg-page px-4 py-3 text-center font-medium">{o}</li>
            ))}
          </ul>
        </Reveal>
      </Section>

      <Section>
        <SectionHead title="ผลงานและแกลเลอรี" sub={albums.length ? "แยกตามอัลบั้ม" : "[ยังไม่มีรูปที่อนุมัติ — เพิ่มรูปได้ที่หลังบ้าน]"} />
        <div className="space-y-8">
          {albums.map((a) => (
            <Reveal key={a.slug} className="space-y-3">
              <h3 className="text-xl font-semibold">{a.title}</h3>
              {a.description && <p className="text-sm text-muted">{a.description}</p>}
              <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
                {a.photos.map((p) => (
                  <li key={p.id} className="overflow-hidden rounded-lg border border-line bg-pink-soft">
                    {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized webp variants */}
                    <img src={p.src[480]} srcSet={`${p.src[480]} 480w, ${p.src[960]} 960w`} sizes="(max-width: 1024px) 50vw, 320px" alt={p.caption || a.title} width={p.w} height={p.h} loading="lazy" draggable={false} className="no-select aspect-[4/3] w-full object-cover" />
                    {p.caption && <p className="px-3 py-2 text-sm text-muted">{p.caption}</p>}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section tone="brand">
        <SectionHead title="ประวัติโรงเรียนอุตรดิตถ์" sub="ก่อตั้ง พ.ศ. 2452" dark />
        <Timeline dark />
      </Section>

      <Section>
        <SectionHead title="สัญลักษณ์โรงเรียน" sub="กดหรือชี้เพื่อดูความหมาย" />
        <ul className="grid gap-6 md:grid-cols-3">
          {SYMBOLS.map((s, i) => (
            <Reveal as="li" key={s.title} index={i}>
              <FlipCard
                label={s.title}
                front={
                  <div className="flex h-full flex-col items-center justify-center gap-4">
                    <span aria-hidden className="text-6xl text-pink">{s.icon}</span>
                    <p className="font-display text-xl font-semibold">{s.title}</p>
                  </div>
                }
                back={<div className="flex h-full items-center"><p>{s.body}</p></div>}
              />
            </Reveal>
          ))}
        </ul>
      </Section>
    </>
  );
}
