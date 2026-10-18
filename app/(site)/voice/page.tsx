import type { Metadata } from "next";
import { VoiceForm } from "@/components/sections/VoiceForm";
import { VoiceTracker } from "@/components/sections/VoiceTracker";
import { PageHero, Section } from "@/components/ui/bits";

export const metadata: Metadata = { title: "ส่งเสียงถึงสภา", description: "ส่งความคิดเห็นหรือเรื่องร้องเรียนถึงสภานักเรียน ไม่ระบุตัวตนได้ และติดตามสถานะด้วยรหัสอ้างอิง" };

export default function VoicePage() {
  return (
    <>
      <PageHero title="ส่งเสียงถึงสภา" sub="ไม่ระบุตัวตนได้ · ข้อความไม่ถูกเผยแพร่ต่อสาธารณะโดยอัตโนมัติ" />
      <Section>
        <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-2">
          <VoiceForm />
          <div className="space-y-6">
            <VoiceTracker />
            <p className="text-sm text-muted">เราเก็บเฉพาะข้อความและรหัสอ้างอิงของคุณ ที่อยู่ IP ถูกแปลงเป็นค่าแฮชเพื่อป้องกันการส่งซ้ำเท่านั้น</p>
          </div>
        </div>
      </Section>
    </>
  );
}
