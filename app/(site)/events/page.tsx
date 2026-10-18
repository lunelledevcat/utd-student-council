import type { Metadata } from "next";
import { EventCard } from "@/components/sections/EventsSection";
import { Reveal } from "@/components/ui/Reveal";
import { PageHero, Section } from "@/components/ui/bits";
import { getEvents } from "@/lib/content";

export const metadata: Metadata = { title: "กิจกรรม", description: "ปฏิทินกิจกรรมของสภานักเรียนโรงเรียนอุตรดิตถ์" };

export default function EventsPage() {
  return (
    <>
      <PageHero title="กิจกรรม" sub="ปฏิทินกิจกรรมที่ใกล้ถึง" />
      <Section>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {getEvents().map((e, i) => (
            <Reveal as="li" key={e.slug} index={i % 4}><EventCard item={e} /></Reveal>
          ))}
        </ul>
      </Section>
    </>
  );
}
