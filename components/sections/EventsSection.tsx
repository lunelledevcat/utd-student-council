import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { TiltCard } from "@/components/ui/TiltCard";
import { Section, SectionHead } from "@/components/ui/bits";
import { daysUntil, type EventItem } from "@/lib/content";
import { thaiDay, thaiMonth } from "@/lib/utils";

export function EventCard({ item }: { item: EventItem }) {
  const d = daysUntil(item.date);
  return (
    <TiltCard className="h-full rounded-lg border border-line bg-surface p-6 shadow-soft">
      <Link href={`/events/${item.slug}`} className="block space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-brand px-4 py-2 text-center text-on-brand">
            <p className="font-display text-[28px] font-semibold leading-tight">{thaiDay(item.date)}</p>
            <p className="text-sm font-medium text-gold">{thaiMonth(item.date)}</p>
          </div>
          <span className="rounded-full bg-pink-soft px-3 py-1 text-sm font-medium">
            {d === 0 ? "วันนี้" : `อีก ${d} วัน`}
          </span>
        </div>
        <h3 className="text-xl font-semibold">{item.title}</h3>
        <p className="text-[15px] text-muted">{item.place} · {item.time}</p>
      </Link>
    </TiltCard>
  );
}

export function EventsSection({ items }: { items: EventItem[] }) {
  return (
    <Section>
      <SectionHead title="กิจกรรมที่ใกล้ถึง" sub="ปฏิทินกิจกรรมของสภานักเรียน" href="/events" linkLabel="ดูปฏิทิน" />
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-4">
        {items.map((e, i) => (
          <Reveal as="li" key={e.slug} index={i}><EventCard item={e} /></Reveal>
        ))}
      </ul>
    </Section>
  );
}
