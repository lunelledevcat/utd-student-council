import { Reveal } from "@/components/ui/Reveal";
import { Section, SectionHead } from "@/components/ui/bits";
import { getLatestPhotos } from "@/lib/content";
import { cn } from "@/lib/utils";

// [placeholder] shown until the first photo is approved
const TILES = [
  { label: "กีฬาสี", cls: "bg-brand-mid text-on-brand" },
  { label: "วันสำคัญ", cls: "bg-pink-soft text-ink" },
  { label: "ดนตรี", cls: "bg-brand text-on-brand" },
];

// bento: some tiles are taller / wider
const SPANS = ["row-span-2", "", "", "row-span-2", "", ""];

export async function Gallery() {
  const photos = await getLatestPhotos(6);
  return (
    <Section>
      <SectionHead title="ภาพผลงานและกิจกรรม" sub={photos.length ? "ภาพล่าสุดจากกิจกรรมของสภา" : "ภาพบรรยากาศจากกิจกรรมของสภา [ใส่รูปจริง]"} />
      {photos.length > 0 ? (
        <ul className="grid auto-rows-[180px] grid-cols-2 gap-3 md:gap-4 lg:auto-rows-[240px] lg:grid-cols-4">
          {photos.map((p, i) => (
            <Reveal as="li" key={p.id} index={i % 4} className={cn("group relative overflow-hidden rounded-lg border border-line bg-pink-soft", SPANS[i])}>
              {/* eslint-disable-next-line @next/next/no-img-element -- variants are pre-sized webp in Supabase Storage */}
              <img
                src={p.src[960]}
                srcSet={`${p.src[480]} 480w, ${p.src[960]} 960w`}
                sizes="(max-width: 1024px) 50vw, 330px"
                alt={p.caption || "ภาพกิจกรรมสภานักเรียน"}
                width={p.w}
                height={p.h}
                loading="lazy"
                draggable={false}
                className="no-select h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {(p.caption || p.album) && (
                <span className="absolute bottom-3 left-3 max-w-[85%] truncate rounded-full bg-surface px-3 py-1 text-sm font-medium text-ink">{p.caption || p.album}</span>
              )}
            </Reveal>
          ))}
        </ul>
      ) : (
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
      )}
    </Section>
  );
}
