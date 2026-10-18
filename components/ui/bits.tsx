import Link from "next/link";
import { Mandapa } from "@/components/ui/Mandapa";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";

export function Section({
  children,
  className,
  tone = "page",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "page" | "surface" | "brand" | "deep";
  id?: string;
}) {
  const tones = {
    page: "bg-page text-ink",
    surface: "bg-surface text-ink",
    brand: "bg-brand text-on-brand",
    deep: "bg-brand-deep text-on-brand",
  };
  return (
    <section id={id} className={cn("px-4 py-16 md:py-24 lg:px-20", tones[tone], className)}>
      <div className="mx-auto max-w-[1280px]">{children}</div>
    </section>
  );
}

export function SectionHead({
  title,
  sub,
  href,
  linkLabel,
  dark,
}: {
  title: string;
  sub?: string;
  href?: string;
  linkLabel?: string;
  dark?: boolean;
}) {
  return (
    <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-4 md:mb-12">
      <div className="space-y-2">
        <h2 className="text-3xl font-semibold md:text-[36px]">{title}</h2>
        {sub && <p className={cn("text-base", dark ? "font-serif text-xl text-gold" : "text-muted")}>{sub}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className={cn(
            "rounded-full border-2 px-5 py-2 font-medium transition-colors",
            dark ? "border-on-brand text-on-brand hover:bg-white/10" : "border-brand text-ink hover:bg-brand hover:text-on-brand",
          )}
        >
          {linkLabel ?? "ดูทั้งหมด"}
        </Link>
      )}
    </Reveal>
  );
}

export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-full bg-pink-soft px-3 py-1 text-sm font-medium text-ink">
      {children}
    </span>
  );
}

/** Dark header band for inner pages (the floating navbar sits on top of it). */
export function PageHero({ title, sub }: { title: string; sub?: string }) {
  return (
    <header className="relative overflow-hidden bg-gradient-to-br from-brand-deep to-brand-mid px-4 pb-16 pt-36 text-on-brand lg:px-20">
      <Mandapa className="no-select pointer-events-none absolute -bottom-2 right-0 h-64 w-[22rem] text-brand-deep opacity-70" stroke="var(--c-gold)" />
      <div className="relative mx-auto max-w-[1280px] space-y-3">
        <h1 className="text-4xl font-bold md:text-[48px]">{title}</h1>
        {sub && <p className="max-w-2xl font-serif text-xl text-pink-soft">{sub}</p>}
      </div>
    </header>
  );
}

export function ImagePlaceholder({ label, className }: { label: string; className?: string }) {
  return (
    <div
      role="img"
      aria-label={label}
      className={cn("grid place-items-center rounded-md bg-pink-soft text-center text-sm text-muted", className)}
    >
      <span className="px-4">{label}</span>
    </div>
  );
}
