import type { Metadata } from "next";
import { Reveal } from "@/components/ui/Reveal";
import { PageHero, Section } from "@/components/ui/bits";
import { DOCUMENTS } from "@/lib/content";
import { thaiDate } from "@/lib/utils";

export const metadata: Metadata = { title: "เอกสาร", description: "รายงานการประชุมและประกาศของสภานักเรียน" };

export default function DocumentsPage() {
  return (
    <>
      <PageHero title="เอกสาร" sub="รายงานการประชุม ประกาศ และเอกสารดาวน์โหลด [ตัวอย่าง]" />
      <Section>
        <ul className="mx-auto max-w-3xl divide-y divide-line rounded-lg border border-line bg-surface">
          {DOCUMENTS.map((d, i) => (
            <Reveal as="li" key={d.id} index={i} className="flex items-center justify-between gap-4 p-6">
              <div>
                <p className="font-medium">{d.title}</p>
                <p className="text-sm text-muted">{thaiDate(d.date)} · {d.type}</p>
              </div>
              <a href={d.href} className="rounded-full border-2 border-brand px-5 py-2 font-medium hover:bg-brand hover:text-on-brand">ดาวน์โหลด</a>
            </Reveal>
          ))}
        </ul>
      </Section>
    </>
  );
}
