import type { Metadata } from "next";
import { PolicyTracker } from "@/components/sections/PolicyTracker";
import { PageHero, Section } from "@/components/ui/bits";
import { getPolicies } from "@/lib/content";

export const metadata: Metadata = { title: "นโยบาย", description: "นโยบายสภานักเรียนและความคืบหน้า" };

export default function PoliciesPage() {
  return (
    <>
      <PageHero title="นโยบาย" sub="ติดตามความคืบหน้าของทุกนโยบาย [ตัวอย่าง]" />
      <Section><PolicyTracker policies={getPolicies()} /></Section>
    </>
  );
}
