import { EventsSection } from "@/components/sections/EventsSection";
import { Gallery } from "@/components/sections/Gallery";
import { NewsSection } from "@/components/sections/NewsSection";
import { PolicyTracker } from "@/components/sections/PolicyTracker";
import { President } from "@/components/sections/President";
import { PrideStrip } from "@/components/sections/PrideStrip";
import { Stats } from "@/components/sections/Stats";
import { VoiceSection } from "@/components/sections/VoiceSection";
import { Section, SectionHead } from "@/components/ui/bits";
import { getEvents, getNews, getPolicies } from "@/lib/content";

// Order follows the reference's first tab (announcements -> activities); sections the reference lacks follow, grouped by kind.
// Banner (Hero, the approved-photo slideshow) and the tab bar are rendered by the (site) layout.
export default async function HomePage() {
  const [news, events] = await Promise.all([getNews(), getEvents()]);
  return (
    <>
      <NewsSection items={news.slice(0, 6)} />
      <EventsSection items={events.slice(0, 4)} />
      <Gallery />
      <Stats />
      <Section>
        <SectionHead title="ติดตามนโยบาย" sub="ความคืบหน้าของนโยบายสภานักเรียน [ตัวอย่าง]" href="/policies" />
        <PolicyTracker policies={getPolicies()} limit={4} />
      </Section>
      <President />
      <VoiceSection />
      <PrideStrip />
    </>
  );
}
