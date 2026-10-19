import { HeroSlides } from "@/components/sections/HeroSlides";
import { HeroText } from "@/components/sections/HeroText";
import { Petals } from "@/components/ui/Petals";
import { getHeroPhotos } from "@/lib/content";

/**
 * Banner: rounded full-frame photo slider inside the container (16:5 desktop like the reference, 4:3 phones),
 * headline over the left side on a navy gradient, thin pink line under it.
 * Slides = approved photos an admin ticked "is_hero"; none -> one gradient slide.
 */
export async function Hero({ year }: { year: number }) {
  const photos = await getHeroPhotos();
  return (
    <div className="mx-auto max-w-[1320px] px-4 pt-4 md:pt-7">
      <HeroSlides photos={photos}>
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-deep/90 via-brand-deep/35 to-transparent md:bg-gradient-to-r md:from-brand-deep/90 md:via-brand-deep/45 md:to-transparent" />
        <Petals />
        <HeroText year={year} />
      </HeroSlides>
      <div aria-hidden className="mx-auto mt-3 h-[3px] w-2/3 rounded-full bg-gradient-to-r from-transparent via-pink to-transparent opacity-80" />
    </div>
  );
}
