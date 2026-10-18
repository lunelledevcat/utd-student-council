import type { Metadata } from "next";
import { NewsCard } from "@/components/sections/NewsSection";
import { Reveal } from "@/components/ui/Reveal";
import { Pager } from "@/components/ui/Pager";
import { PageHero, Section } from "@/components/ui/bits";
import { getNews } from "@/lib/content";
import { paginate } from "@/lib/pagination";

export const metadata: Metadata = { title: "ข่าวและประกาศ", description: "ข่าวสารและประกาศจากสภานักเรียนโรงเรียนอุตรดิตถ์" };

export default async function NewsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = await searchParams;
  const r = paginate(getNews(), Number(page), 6);
  return (
    <>
      <PageHero title="ข่าวและประกาศ" sub="ข่าวล่าสุดจากสภานักเรียน" />
      <Section>
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
          {r.items.map((n, i) => (
            <Reveal as="li" key={n.slug} index={i % 3}><NewsCard item={n} /></Reveal>
          ))}
        </ul>
        <Pager base="/news" page={r.page} pages={r.pages} />
      </Section>
    </>
  );
}
