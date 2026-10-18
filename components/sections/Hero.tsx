import { HeroParallax } from "@/components/sections/HeroParallax";
import { HeroSlides } from "@/components/sections/HeroSlides";
import { Petals } from "@/components/ui/Petals";
import { WordReveal } from "@/components/ui/WordReveal";
import { getHeroPhotos } from "@/lib/content";
import { SITE } from "@/lib/site";
import { thaiWords } from "@/lib/utils";

/**
 * Banner: rounded card inside the container (16:5 desktop like the reference, 4:3 phones), thin pink line under it.
 * Slides = approved photos an admin ticked "is_hero" (Ken Burns + crossfade). None -> navy gradient + mandapa parallax.
 */
export async function Hero({ year }: { year: number }) {
  const photos = await getHeroPhotos();
  return (
    <div className="mx-auto max-w-[1320px] px-4 pt-4 md:pt-7">
      <section
        aria-label="แบนเนอร์"
        className="relative isolate aspect-[4/3] overflow-hidden rounded-[20px] bg-gradient-to-br from-brand-deep via-[#0b1f4d] to-brand-mid text-on-brand shadow-soft sm:aspect-[16/7] lg:aspect-[16/5]"
      >
        {photos.length > 0 ? <HeroSlides photos={photos} /> : <HeroParallax />}
        <Petals />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-deep/85 via-brand-deep/25 to-transparent md:bg-gradient-to-r md:from-brand-deep/85 md:via-brand-deep/35" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 max-w-[760px] space-y-2 p-5 pb-10 md:inset-y-0 md:flex md:flex-col md:justify-center md:space-y-3 md:p-12">
          <p className="w-fit rounded-full border border-gold/70 bg-brand-deep/30 px-3.5 py-0.5 text-sm font-medium text-gold backdrop-blur">
            ปีการศึกษา {year}
          </p>
          <h1 className="text-[1.65rem] font-bold leading-tight drop-shadow sm:text-[2.2rem] lg:text-[2.9rem]">
            <WordReveal words={thaiWords("คณะกรรมการสภานักเรียน")} delay={0.15} />
            <br />
            <WordReveal words={thaiWords(SITE.school)} delay={0.5} className="text-pink-400" />
          </h1>
          <p className="text-sm tracking-[0.08em] text-on-brand/75 md:text-base">{SITE.nameEn}</p>
        </div>
      </section>
      <div aria-hidden className="mx-auto mt-3 h-[3px] w-2/3 rounded-full bg-gradient-to-r from-transparent via-pink to-transparent opacity-80" />
    </div>
  );
}
