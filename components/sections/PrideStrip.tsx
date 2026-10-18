import { Section, SectionHead } from "@/components/ui/bits";
import { Timeline } from "@/components/sections/Timeline";

export function PrideStrip() {
  return (
    <Section tone="brand">
      <SectionHead title="ภูมิใจในโรงเรียนอุตรดิตถ์" sub="มรดกกว่าร้อยปี ตั้งแต่ พ.ศ. 2452" href="/council" linkLabel="ประวัติโรงเรียน" dark />
      <Timeline dark />
    </Section>
  );
}
