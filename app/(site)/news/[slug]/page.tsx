import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ImagePlaceholder, PageHero, Section, Tag } from "@/components/ui/bits";
import { getNewsBySlug } from "@/lib/content";
import { thaiDate } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const n = await getNewsBySlug((await params).slug);
  return n ? { title: n.title, description: n.excerpt, openGraph: { title: n.title, description: n.excerpt } } : {};
}

export default async function NewsDetail({ params }: Props) {
  const n = await getNewsBySlug((await params).slug);
  if (!n) notFound();
  return (
    <>
      <PageHero title={n.title} sub={thaiDate(n.date)} />
      <Section>
        <article className="mx-auto max-w-3xl space-y-6">
          <Tag>{n.tag}</Tag>
          <ImagePlaceholder label="[รูปประกอบข่าว]" className="aspect-video w-full rounded-lg" />
          {n.body.map((p, i) => <p key={i} className="text-lg">{p}</p>)}
          <Link href="/news" className="inline-block font-medium text-pink hover:underline">← กลับไปหน้าข่าว</Link>
        </article>
      </Section>
    </>
  );
}
