"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import type { Activity, Announcement } from "@/lib/content";
import { EmptyState } from "@/components/home/EmptyState";
import { CardItem, DateChip, Prose, ZoneTitle } from "@/components/home/parts";
import { Gallery } from "@/components/ui/Gallery";
import { Modal } from "@/components/ui/Modal";
import { SmartImage } from "@/components/ui/SmartImage";
import { IconExternal, IconImages, IconLink, IconMegaphone, IconPin, IconStar } from "@/components/ui/icons";

export function NewsTab({ announcements, activities, query, onClear }: {
  announcements: Announcement[]; activities: Activity[]; query: string; onClear: () => void;
}) {
  const [ann, setAnn] = useState<Announcement | null>(null);
  const [act, setAct] = useState<Activity | null>(null);
  const nothing = announcements.length === 0 && activities.length === 0;

  if (nothing) return <ul className="grid"><EmptyState query={query} onClear={onClear} what="กิจกรรมและข่าวสาร" /></ul>;

  return (
    <div className="space-y-12">
      {announcements.length > 0 && (
        <section aria-labelledby="ann-h">
          <ZoneTitle icon={<IconMegaphone width={18} height={18} />} count={announcements.length}><span id="ann-h">ประชาสัมพันธ์</span></ZoneTitle>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {announcements.map((a, i) => (
                <CardItem key={a.id} index={i}>
                  <AnnouncementCard a={a} onOpen={() => setAnn(a)} />
                </CardItem>
              ))}
            </AnimatePresence>
          </ul>
        </section>
      )}

      {activities.length > 0 && (
        <section aria-labelledby="act-h">
          <ZoneTitle icon={<IconStar width={18} height={18} />} count={activities.length}><span id="act-h">ภาพผลงานและกิจกรรมของสภานักเรียน</span></ZoneTitle>
          <ul className="grid gap-6">
            <AnimatePresence mode="popLayout">
              {activities.map((a, i) => (
                <CardItem key={a.id} index={i}>
                  <WideCard
                    layoutId={`act-${a.id}`}
                    photos={a.photos}
                    alt={a.title}
                    onOpen={() => setAct(a)}
                    caption={<><DateChip iso={a.date} /><span className="font-display font-medium text-strong">{a.title}</span></>}
                    badge={a.photos.length > 1 ? <><IconImages width={14} height={14} /> {a.photos.length} ภาพ</> : null}
                  />
                </CardItem>
              ))}
            </AnimatePresence>
          </ul>
        </section>
      )}

      <AnimatePresence>
        {ann && (
          <Modal key={ann.id} layoutId={`ann-${ann.id}`} title="ประชาสัมพันธ์" icon={<IconMegaphone width={18} height={18} />} onClose={() => setAnn(null)} size="md">
            <div className="space-y-4 p-5 sm:p-7">
              <div>
                <h3 className="text-xl font-semibold text-strong sm:text-2xl">{ann.title}</h3>
                <DateChip iso={ann.date} className="mt-1" />
              </div>
              <SmartImage img={ann.cover} alt={ann.title} sizes="640px" className="aspect-[16/9] w-full rounded-2xl" priority />
              <Prose paragraphs={ann.body} />
              {ann.link && (
                <a
                  href={ann.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-brand-mid px-5 py-3 font-display font-semibold text-brand-mid transition hover:-translate-y-0.5 hover:bg-brand-mid hover:text-white hover:shadow-lift dark:border-sky-strong dark:text-on-brand"
                >
                  <IconExternal width={18} height={18} /> เปิดลิงก์ที่เกี่ยวข้อง
                </a>
              )}
            </div>
          </Modal>
        )}
        {act && (
          <Modal key={act.id} layoutId={`act-${act.id}`} title={act.title} icon={<IconStar width={18} height={18} />} onClose={() => setAct(null)} size="lg">
            <div className="space-y-5 p-5 sm:p-7">
              <DateChip iso={act.date} />
              <Gallery photos={act.photos} alt={act.title} />
              <Prose paragraphs={act.body} />
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

function AnnouncementCard({ a, onOpen }: { a: Announcement; onOpen: () => void }) {
  return (
    <div className="group h-full transition-transform duration-300 ease-out hover:-translate-y-1.5">
    <motion.article layoutId={`ann-${a.id}`} style={{ borderRadius: 20 }} className="h-full overflow-hidden border border-line bg-surface shadow-soft transition-shadow duration-300 group-hover:shadow-lift">
      <button type="button" onClick={onOpen} className="flex h-full w-full flex-col text-left" aria-haspopup="dialog">
        <div className="relative">
          <SmartImage img={a.cover} alt={a.title} sizes="(max-width: 640px) 100vw, 420px" className="aspect-[16/8] w-full" imgClassName="group-hover:scale-105" />
          <span className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-brand-deep/70 text-white shadow backdrop-blur" aria-label={a.pinned ? "ปักหมุด" : undefined}>
            {a.pinned ? <IconPin width={16} height={16} /> : <IconMegaphone width={16} height={16} />}
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-1.5 p-5">
          <DateChip iso={a.date} />
          <h3 className="flex items-start gap-2 font-display text-[1.05rem] font-semibold leading-snug text-strong">
            <span className="line-clamp-2">{a.title}</span>
            {a.link && <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-sky text-brand-mid" aria-label="มีลิงก์"><IconLink width={13} height={13} /></span>}
          </h3>
          <p className="line-clamp-2 text-sm text-muted">{a.body.join(" ")}</p>
        </div>
      </button>
    </motion.article>
    </div>
  );
}

/** Full-width 16:5 photo card with caption underneath (reference "ภาพผลงาน"); photos crossfade while it is hovered/visible. */
export function WideCard({
  layoutId, photos, alt, caption, badge, onOpen, footer, imageWrap,
}: {
  layoutId?: string; photos: Activity["photos"]; alt: string; caption: React.ReactNode; badge?: React.ReactNode; onOpen?: () => void;
  footer?: React.ReactNode; imageWrap?: (img: React.ReactNode) => React.ReactNode;
}) {
  const reduce = useReducedMotion();
  const [k, setK] = useState(0);
  const n = Math.max(photos.length, 1);
  useEffect(() => {
    if (reduce || n < 2) return;
    const t = setInterval(() => setK((x) => (x + 1) % n), 5000);
    return () => clearInterval(t);
  }, [n, reduce]);

  const image = (
    <div className="relative aspect-[16/9] w-full overflow-hidden sm:aspect-[16/6] lg:aspect-[16/5]">
      <AnimatePresence initial={false}>
        <motion.div key={k} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1 }}>
          <SmartImage img={photos[k] ?? null} alt={alt} sizes="(max-width: 1320px) 100vw, 1320px" className="h-full w-full" imgClassName="group-hover:scale-105" />
        </motion.div>
      </AnimatePresence>
      {badge && <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-brand-deep/70 px-3 py-1 text-xs font-medium text-white backdrop-blur">{badge}</span>}
    </div>
  );
  const body = (
    <>
      {imageWrap ? imageWrap(image) : image}
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t border-line px-5 py-3.5 text-center text-[0.95rem]">{caption}</div>
      {footer}
    </>
  );
  return (
    <div className="group transition-transform duration-300 ease-out hover:-translate-y-1.5">
      <motion.article layoutId={layoutId} style={{ borderRadius: 20 }} className="overflow-hidden border border-line bg-surface shadow-soft transition-shadow duration-300 group-hover:shadow-lift">
        {onOpen ? <button type="button" onClick={onOpen} aria-haspopup="dialog" className="block w-full text-left">{body}</button> : body}
      </motion.article>
    </div>
  );
}
