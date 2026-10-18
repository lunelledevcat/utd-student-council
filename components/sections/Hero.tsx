import { HeroParallax } from "@/components/sections/HeroParallax";
import { HeroSlides } from "@/components/sections/HeroSlides";
import { Button } from "@/components/ui/Button";
import { Petals } from "@/components/ui/Petals";
import { WordReveal } from "@/components/ui/WordReveal";
import { getHeroPhotos } from "@/lib/content";
import { SITE } from "@/lib/site";
import { thaiWords } from "@/lib/utils";

/**
 * Banner: rounded 16:5 card inside the container (reference layout), home page only.
 * Slides = approved photos an admin ticked "is_hero". None -> gradient + faint mandapa fallback.
 */
export async function Hero() {
  const photos = await getHeroPhotos();
  return (
    <div className="mx-auto max-w-[1320px] px-3 pt-4 md:pt-7">
      <section
        aria-label="แบนเนอร์"
        className="relative isolate flex items-center overflow-hidden rounded-lg border border-line bg-gradient-to-br from-brand-deep via-brand to-brand-mid text-on-brand shadow-soft md:aspect-[16/5]"
      >
        {photos.length > 0 ? <HeroSlides photos={photos} /> : <HeroParallax />}
        <Petals />
        <div className="pointer-events-none relative max-w-[720px] space-y-3 px-6 py-10 md:space-y-4 md:px-12 md:py-8">
          <p className="inline-flex items-center gap-2 rounded-full border border-gold px-4 py-1 font-serif text-lg text-gold">
            ก่อตั้ง พ.ศ. {SITE.founded}
          </p>
          <h1 className="text-[32px] font-bold leading-[1.25] md:text-[44px] lg:text-[52px]">
            <WordReveal words={thaiWords("สภานักเรียน")} delay={0.1} />{" "}
            <WordReveal words={thaiWords("โรงเรียนอุตรดิตถ์")} delay={0.35} />
          </h1>
          <p className="font-serif text-lg text-pink-soft">
            {SITE.slogan} · วาระปี {SITE.term}
          </p>
          <div className="pointer-events-auto flex flex-wrap gap-3 pt-1">
            <Button href="/events">ดูกิจกรรม</Button>
            <Button href="/voice" variant="outline">ส่งเสียงถึงสภา</Button>
          </div>
        </div>
      </section>
    </div>
  );
}
