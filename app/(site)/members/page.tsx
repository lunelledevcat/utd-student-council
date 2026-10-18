import type { Metadata } from "next";
import { TeamGrid } from "@/components/sections/TeamGrid";
import { PageHero, Section } from "@/components/ui/bits";
import { getMembers } from "@/lib/content";

export const metadata: Metadata = { title: "สมาชิกสภา", description: "สมาชิกสภานักเรียนโรงเรียนอุตรดิตถ์แยกตามฝ่าย" };

export default async function MembersPage() {
  const members = (await getMembers()).map(({ id, name, role, dept, grade }) => ({ id, name, role, dept, grade }));
  return (
    <>
      <PageHero title="สมาชิกสภา" sub="สมาชิกสภานักเรียน วาระปี [25xx]" />
      <Section><TeamGrid members={members} /></Section>
    </>
  );
}
