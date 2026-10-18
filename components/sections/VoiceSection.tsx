import { VoiceForm } from "@/components/sections/VoiceForm";
import { Reveal } from "@/components/ui/Reveal";
import { Section, Tag } from "@/components/ui/bits";

// [placeholder] ตัวอย่างเรื่องที่สภาตอบแล้ว — ต้องผ่านการอนุมัติก่อนเผยแพร่จริง
const ANSWERED = [
  { tag: "สิ่งแวดล้อม", q: "[คำถามจากนักเรียน 1 — ตัวอย่าง]", a: "[คำตอบจากสภา — ใส่ข้อความจริง]" },
  { tag: "การเรียน", q: "[คำถามจากนักเรียน 2 — ตัวอย่าง]", a: "[คำตอบจากสภา — ใส่ข้อความจริง]" },
  { tag: "กิจกรรม", q: "[คำถามจากนักเรียน 3 — ตัวอย่าง]", a: "[คำตอบจากสภา — ใส่ข้อความจริง]" },
];

export function VoiceSection() {
  return (
    <Section tone="surface">
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
        <Reveal><VoiceForm /></Reveal>
        <div className="space-y-6">
          <Reveal><h2 className="text-[28px] font-semibold">เรื่องที่สภาตอบแล้ว</h2></Reveal>
          {ANSWERED.map((x, i) => (
            <Reveal key={x.q} index={i + 1} className="space-y-3 rounded-lg border border-line bg-page p-6">
              <div className="flex items-center gap-3">
                <Tag>{x.tag}</Tag>
                <span className="flex items-center gap-2 text-sm text-muted"><span aria-hidden className="h-2 w-2 rounded-full bg-done" />ตอบแล้ว</span>
              </div>
              <p className="font-medium">{x.q}</p>
              <p className="text-[15px] text-muted">{x.a}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}
