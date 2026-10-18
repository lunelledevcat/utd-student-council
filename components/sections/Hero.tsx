import { HeroParallax } from "@/components/sections/HeroParallax";
import { Button } from "@/components/ui/Button";
import { Petals } from "@/components/ui/Petals";
import { WordReveal } from "@/components/ui/WordReveal";
import { SITE } from "@/lib/site";
import { thaiWords } from "@/lib/utils";

export function Hero() {
  return (
    <section className="relative isolate min-h-[640px] overflow-hidden bg-gradient-to-br from-brand-deep via-brand to-brand-mid px-4 pb-24 pt-40 text-on-brand md:min-h-[780px] lg:px-20">
      <HeroParallax />
      <Petals />
      <div className="relative mx-auto max-w-[1280px]">
        <div className="max-w-[720px] space-y-6">
          <p className="inline-flex items-center gap-2 rounded-full border border-gold px-4 py-1.5 font-serif text-xl text-gold">
            ก่อตั้ง พ.ศ. {SITE.founded}
          </p>
          <h1 className="text-[40px] font-bold leading-[1.25] md:text-[64px]">
            <WordReveal words={thaiWords("สภานักเรียน")} delay={0.1} />
            <br />
            <WordReveal words={thaiWords("โรงเรียนอุตรดิตถ์")} delay={0.35} />
          </h1>
          <p className="font-serif text-xl text-pink-soft">
            {SITE.slogan} · วาระปี {SITE.term}
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <Button href="/policies">ดูนโยบาย</Button>
            <Button href="/voice" variant="outline">ส่งเสียงถึงสภา</Button>
          </div>
        </div>
      </div>
    </section>
  );
}
