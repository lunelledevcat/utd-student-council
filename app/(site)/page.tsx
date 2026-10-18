import { AnnouncementMarquee } from "@/components/sections/AnnouncementMarquee";
import { EventsSection } from "@/components/sections/EventsSection";
import { Gallery } from "@/components/sections/Gallery";
import { Hero } from "@/components/sections/Hero";
import { NewsSection } from "@/components/sections/NewsSection";
import { PolicyTracker } from "@/components/sections/PolicyTracker";
import { President } from "@/components/sections/President";
import { PrideStrip } from "@/components/sections/PrideStrip";
import { Stats } from "@/components/sections/Stats";
import { VoiceSection } from "@/components/sections/VoiceSection";
import { Section, SectionHead } from "@/components/ui/bits";
import { getEvents, getNews, getPolicies } from "@/lib/content";

export default function HomePage() {
  return (
    <>
      <Hero />
      <AnnouncementMarquee />
      <Stats />
      <President />
      <Section tone="surface">
        <SectionHead title="ติดตามนโยบาย" sub="ความคืบหน้าของนโยบายสภานักเรียน [ตัวอย่าง]" href="/policies" />
        <PolicyTracker policies={getPolicies()} limit={6} />
      </Section>
      <NewsSection items={getNews().slice(0, 4)} />
      <EventsSection items={getEvents().slice(0, 4)} />
      <VoiceSection />
      <Gallery />
      <PrideStrip />
    </>
  );
}
