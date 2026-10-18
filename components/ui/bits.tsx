import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";

/** Content container shared by every page (1320px, like the reference). Dark tones become rounded panels, not full-bleed bands. */
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
  const panels = {
    page: "",
    surface: "rounded-lg border border-line bg-surface p-5 shadow-soft md:p-8",
    brand: "rounded-lg bg-brand p-5 text-on-brand shadow-soft md:p-8",
    deep: "rounded-lg bg-brand-deep p-5 text-on-brand shadow-soft md:p-8",
  };
  return (
    <section id={id} className={cn("mx-auto max-w-[1320px] px-3 py-5 md:py-8", className)}>
      <div className={panels[tone]}>{children}</div>
    </section>
  );
}

/** Title with gold flower + fading rule (the reference's "zone title"). */
export function ZoneTitle({
  as: H = "h2",
  children,
  dark,
  action,
}: {
  as?: "h1" | "h2" | "h3";
  children: React.ReactNode;
  dark?: boolean;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <H className={cn("flex items-center gap-2 text-[1.12rem] font-semibold md:text-[1.4rem]", dark ? "text-on-brand" : "text-strong")}>
        <span aria-hidden className="text-gold">✿</span>
        {children}
      </H>
      <span aria-hidden className={cn("h-px flex-1 bg-gradient-to-r to-transparent", dark ? "from-white/30" : "from-line")} />
      {action}
    </div>
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
    <Reveal className="mb-5 md:mb-6">
      <ZoneTitle
        dark={dark}
        action={
          href && (
            <Link
              href={href}
              className={cn(
                "shrink-0 rounded-full border-2 px-4 py-1 text-sm font-medium transition-colors",
                dark ? "border-on-brand text-on-brand hover:bg-white/10" : "border-brand text-ink hover:bg-brand hover:text-on-brand",
              )}
            >
              {linkLabel ?? "ดูทั้งหมด"}
            </Link>
          )
        }
      >
        {title}
      </ZoneTitle>
      {sub && <p className={cn("mt-1 text-sm", dark ? "font-serif text-base text-gold" : "text-muted")}>{sub}</p>}
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

/** Inner-page heading: the reference has no hero band, just a zone title at the top of the container. */
export function PageHero({ title, sub }: { title: string; sub?: string }) {
  return (
    <header className="mx-auto max-w-[1320px] px-3 pt-6 md:pt-8">
      <ZoneTitle as="h1">{title}</ZoneTitle>
      {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
    </header>
  );
}

export function ImagePlaceholder({ label, className }: { label: string; className?: string }) {
  return (
    <div
      role="img"
      aria-label={label}
      className={cn("grid place-items-center bg-pink-soft text-center text-sm text-muted", className)}
    >
      <span className="px-4">{label}</span>
    </div>
  );
}
