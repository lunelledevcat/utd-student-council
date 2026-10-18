import type { Metadata } from "next";
import { TeamGrid } from "@/components/sections/TeamGrid";
import { PageHero, Section } from "@/components/ui/bits";
import { getMembers } from "@/lib/content";

export const metadata: Metadata = { title: "ทีมงาน", description: "สมาชิกสภานักเรียนโรงเรียนอุตรดิตถ์แยกตามฝ่าย" };

export default function TeamPage() {
  const members = getMembers().map(({ id, name, role, dept, grade }) => ({ id, name, role, dept, grade }));
  return (
    <>
      <PageHero title="ทีมงาน" sub="สมาชิกสภานักเรียน วาระปี [25xx]" />
      <Section><TeamGrid members={members} /></Section>
    </>
  );
}
