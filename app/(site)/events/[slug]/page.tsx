import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero, Section } from "@/components/ui/bits";
import { daysUntil, getEventBySlug } from "@/lib/content";
import { thaiDate } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const e = getEventBySlug((await params).slug);
  return e ? { title: e.title, description: e.summary, openGraph: { title: e.title, description: e.summary } } : {};
}

export default async function EventDetail({ params }: Props) {
  const e = getEventBySlug((await params).slug);
  if (!e) notFound();
  const d = daysUntil(e.date);
  return (
    <>
      <PageHero title={e.title} sub={`${thaiDate(e.date)} · ${d === 0 ? "วันนี้" : `อีก ${d} วัน`}`} />
      <Section>
        <article className="mx-auto max-w-3xl space-y-6">
          <p className="rounded-md bg-pink-soft px-4 py-3 font-medium">{e.place} · {e.time}</p>
          <p className="text-lg text-muted">{e.summary}</p>
          {e.body.map((p, i) => <p key={i} className="text-lg">{p}</p>)}
          <Link href="/events" className="inline-block font-medium text-pink hover:underline">← กลับไปหน้ากิจกรรม</Link>
        </article>
      </Section>
    </>
  );
}
