import Link from "next/link";
import { AnnouncementMarquee } from "@/components/sections/AnnouncementMarquee";
import { Reveal } from "@/components/ui/Reveal";
import { TiltCard } from "@/components/ui/TiltCard";
import { ImagePlaceholder, Section, SectionHead, Tag } from "@/components/ui/bits";
import type { NewsItem } from "@/lib/content";
import { thaiDate } from "@/lib/utils";

/** Reference "announcement card": image on top, date + title + excerpt below. */
export function NewsCard({ item }: { item: NewsItem }) {
  return (
    <TiltCard className="h-full overflow-hidden rounded-lg border border-line bg-surface shadow-soft">
      <Link href={`/news/${item.slug}`} className="flex h-full flex-col">
        <ImagePlaceholder label="[รูปข่าว]" className="aspect-video w-full" />
        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex items-center justify-between gap-2">
            <Tag>{item.tag}</Tag>
            <p className="text-sm font-medium text-gold">{thaiDate(item.date)}</p>
          </div>
          <h3 className="text-lg font-semibold">{item.title}</h3>
          <p className="line-clamp-2 text-sm text-muted">{item.excerpt}</p>
        </div>
      </Link>
    </TiltCard>
  );
}

export function NewsSection({ items }: { items: NewsItem[] }) {
  return (
    <Section>
      <SectionHead title="ประชาสัมพันธ์" sub="ข่าวและประกาศล่าสุดจากสภานักเรียน" href="/news" linkLabel="ข่าวทั้งหมด" />
      <AnnouncementMarquee />
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
        {items.map((n, i) => (
          <Reveal as="li" key={n.slug} index={i % 3}><NewsCard item={n} /></Reveal>
        ))}
      </ul>
    </Section>
  );
}
