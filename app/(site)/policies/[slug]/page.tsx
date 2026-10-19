import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ViewTransition } from "react";
import { Prose } from "@/components/home/parts";
import { PolicyProgress, PolicyTimeline } from "@/components/policy/PolicyMotion";
import { Gallery } from "@/components/ui/Gallery";
import { SmartImage } from "@/components/ui/SmartImage";
import { StatusPill } from "@/components/ui/StatusPill";
import { IconArrowLeft, IconImages, IconUsers } from "@/components/ui/icons";
import { getPolicyBySlug, getYears } from "@/lib/content";
import { homeHref } from "@/lib/search";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getPolicyBySlug((await params).slug);
  return p ? { title: p.title, description: p.summary } : { title: "ไม่พบนโยบาย" };
}

/** Full policy page (opened from tab ②). The card image morphs into this hero (React <ViewTransition>). */
export default async function PolicyPage({ params }: Props) {
  const [p, { current }] = await Promise.all([getPolicyBySlug((await params).slug), getYears()]);
  if (!p) notFound();
  const back = homeHref("policy", p.year, current);
  const gallery = p.photos.length ? p.photos : [];

  return (
    <article className="mx-auto max-w-[1100px] px-4 pb-6 pt-5 md:pt-8">
      <Link
        href={back}
        className="group mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-ink shadow-soft transition hover:-translate-y-0.5 hover:border-pink hover:text-pink"
      >
        <IconArrowLeft width={16} height={16} className="transition-transform group-hover:-translate-x-1" /> กลับไปหน้านโยบาย
      </Link>

      <ViewTransition name={`policy-${p.slug}`} share="morph" default="none">
        <div className="relative overflow-hidden rounded-[24px] shadow-soft">
          {p.cover ?? p.photos[0] ? (
            <SmartImage img={p.cover ?? p.photos[0]} alt={p.title} sizes="(max-width: 1100px) 100vw, 1100px" className="aspect-[16/9] w-full sm:aspect-[16/6]" priority />
          ) : (
            <div aria-hidden className="aspect-[16/9] w-full bg-gradient-to-br from-brand-deep via-brand to-brand-mid sm:aspect-[16/5]">
              <div className="h-full w-full bg-[radial-gradient(60%_90%_at_85%_15%,rgb(242_122_168/0.35),transparent_60%)]" />
            </div>
          )}
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-deep/85 via-brand-deep/15 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 space-y-2 p-5 text-on-brand md:p-8">
            <StatusPill status={p.status} className="bg-white/95" />
            <h1 className="text-2xl font-bold leading-tight drop-shadow md:text-4xl">{p.title}</h1>
          </div>
        </div>
      </ViewTransition>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          {p.summary && <p className="text-lg font-medium text-strong">{p.summary}</p>}
          <section aria-label="รายละเอียดนโยบาย" className="rounded-[20px] border border-line bg-surface p-5 shadow-soft md:p-7">
            <Prose paragraphs={p.body.length ? p.body : ["[รายละเอียดนโยบาย — จะเติมภายหลัง]"]} />
          </section>
          <section aria-labelledby="gal-h">
            <h2 id="gal-h" className="mb-3 flex items-center gap-2 text-lg font-semibold text-strong">
              <IconImages width={18} height={18} /> แกลเลอรีภาพ
            </h2>
            {gallery.length ? (
              <Gallery photos={gallery} alt={p.title} />
            ) : (
              <p className="rounded-[20px] border border-dashed border-line p-6 text-center text-sm text-muted">[ยังไม่มีภาพประกอบ — จะเติมภายหลัง]</p>
            )}
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          <section className="rounded-[20px] border border-line bg-surface p-5 shadow-soft">
            <h2 className="mb-3 text-base font-semibold text-strong">ความคืบหน้า</h2>
            <PolicyProgress value={p.progress} status={p.status} />
          </section>
          <section className="rounded-[20px] border border-line bg-surface p-5 shadow-soft">
            <h2 className="mb-2 flex items-center gap-2 text-base font-semibold text-strong">
              <IconUsers width={17} height={17} /> ผู้รับผิดชอบ
            </h2>
            <p className="text-ink">{p.owner || "[ผู้รับผิดชอบ — จะเติมภายหลัง]"}</p>
          </section>
          <section className="rounded-[20px] border border-line bg-surface p-5 shadow-soft">
            <h2 className="mb-4 text-base font-semibold text-strong">ไทม์ไลน์ความคืบหน้า</h2>
            {p.timeline.length ? <PolicyTimeline steps={p.timeline} /> : <p className="text-sm text-muted">[ยังไม่มีไทม์ไลน์ — จะเติมภายหลัง]</p>}
          </section>
        </aside>
      </div>
    </article>
  );
}
