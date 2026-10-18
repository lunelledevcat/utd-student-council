import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { TiltCard } from "@/components/ui/TiltCard";
import { ImagePlaceholder, Section, SectionHead, Tag } from "@/components/ui/bits";
import type { NewsItem } from "@/lib/content";
import { thaiDate } from "@/lib/utils";

export function NewsCard({ item, featured }: { item: NewsItem; featured?: boolean }) {
  return (
    <TiltCard className="h-full rounded-lg border border-line bg-page p-4">
      <Link href={`/news/${item.slug}`} className={featured ? "flex h-full flex-col gap-4" : "flex items-center gap-4"}>
        <ImagePlaceholder label="[รูปข่าว]" className={featured ? "min-h-[260px] flex-1" : "h-28 w-28 shrink-0 text-xs"} />
        <div className={featured ? "space-y-3 px-2 pb-4" : "space-y-2"}>
          <Tag>{item.tag}</Tag>
          <h3 className={featured ? "text-[28px] font-semibold" : "text-xl font-semibold"}>{item.title}</h3>
          <p className="text-sm text-muted">{thaiDate(item.date)}</p>
        </div>
      </Link>
    </TiltCard>
  );
}

export function NewsSection({ items }: { items: NewsItem[] }) {
  const [first, ...rest] = items;
  return (
    <Section tone="surface">
      <SectionHead title="ข่าวและประกาศ" sub="ข่าวล่าสุดจากสภานักเรียน" href="/news" linkLabel="ข่าวทั้งหมด" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Reveal><NewsCard item={first} featured /></Reveal>
        <div className="grid gap-6">
          {rest.slice(0, 3).map((n, i) => (
            <Reveal key={n.slug} index={i + 1}><NewsCard item={n} /></Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}
