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
// Banner (Hero) and tab bar are rendered by the (site) layout.
export default function HomePage() {
  return (
    <>
      <NewsSection items={getNews().slice(0, 6)} />
      <Gallery />
      <EventsSection items={getEvents().slice(0, 4)} />
      <Section>
        <SectionHead title="ติดตามนโยบาย" sub="ความคืบหน้าของนโยบายสภานักเรียน [ตัวอย่าง]" href="/policies" />
        <PolicyTracker policies={getPolicies()} limit={8} />
      </Section>
      <President />
      <Stats />
      <VoiceSection />
      <PrideStrip />
    </>
  );
}
