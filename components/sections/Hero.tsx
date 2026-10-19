import { HeroSlides } from "@/components/sections/HeroSlides";
import { Petals } from "@/components/ui/Petals";
import { WordReveal } from "@/components/ui/WordReveal";
import { getHeroPhotos } from "@/lib/content";
import { SITE } from "@/lib/site";
import { thaiWords } from "@/lib/utils";

/**
 * Banner: rounded full-frame photo slider inside the container (16:5 desktop like the reference, 4:3 phones),
 * headline over the left side on a navy gradient, thin pink line under it.
 * Slides = approved photos an admin ticked "is_hero"; none -> one navy gradient slide.
 */
export async function Hero({ year }: { year: number }) {
  const photos = await getHeroPhotos();
  return (
    <div className="mx-auto max-w-[1320px] px-4 pt-4 md:pt-7">
      <section
        aria-label="แบนเนอร์"
        className="relative isolate aspect-[4/3] overflow-hidden rounded-[20px] bg-gradient-to-br from-brand-deep via-[#0b1f4d] to-brand-mid text-on-brand shadow-soft sm:aspect-[16/7] lg:aspect-[16/5]"
      >
        <HeroSlides photos={photos}>
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-deep/90 via-brand-deep/35 to-transparent md:bg-gradient-to-r md:from-brand-deep/90 md:via-brand-deep/45 md:to-transparent" />
          <Petals />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 max-w-[760px] space-y-2 p-5 pb-11 md:inset-y-0 md:flex md:flex-col md:justify-center md:space-y-3 md:px-20 md:py-12">
            <p className="w-fit rounded-full border border-gold/70 bg-brand-deep/35 px-3.5 py-0.5 text-sm font-medium text-gold backdrop-blur">
              ปีการศึกษา {year}
            </p>
            <h1 className="text-[1.65rem] font-bold leading-tight drop-shadow-[0_2px_12px_rgb(5_13_36/0.6)] sm:text-[2.2rem] lg:text-[2.9rem]">
              <WordReveal words={thaiWords("คณะกรรมการสภานักเรียน")} delay={0.15} />
              <br />
              <WordReveal words={thaiWords(SITE.school)} delay={0.5} className="text-pink-400" />
            </h1>
            <p className="text-sm tracking-[0.08em] text-on-brand/80 md:text-base">{SITE.nameEn}</p>
          </div>
        </HeroSlides>
      </section>
      <div aria-hidden className="mx-auto mt-3 h-[3px] w-2/3 rounded-full bg-gradient-to-r from-transparent via-pink to-transparent opacity-80" />
    </div>
  );
}
