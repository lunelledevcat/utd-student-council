"use client";

import { useState } from "react";
import type { Img } from "@/lib/content";
import { IconImages, IconUser } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

/**
 * Image with a loading skeleton: the stored tiny blur (if any) shows instantly, a shimmer runs until the real
 * file decodes, then it fades in. `img = null` (no approved photo yet) renders a designed [placeholder] tile.
 * Sizing comes from the wrapper (`className`), the image always covers it.
 */
export function SmartImage({
  img,
  alt,
  sizes = "100vw",
  className,
  imgClassName,
  kind = "photo",
  priority,
  label,
}: {
  img: Img | null;
  alt: string;
  sizes?: string;
  className?: string;
  imgClassName?: string;
  kind?: "photo" | "portrait";
  priority?: boolean;
  label?: string;
}) {
  const [loaded, setLoaded] = useState(false);

  if (!img) {
    const Icon = kind === "portrait" ? IconUser : IconImages;
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          "relative grid place-items-center overflow-hidden",
          kind === "portrait"
            ? "bg-gradient-to-b from-sky to-sky-strong text-brand-mid/45"
            : "bg-[radial-gradient(120%_90%_at_10%_0%,var(--c-sky-strong),transparent_60%),radial-gradient(90%_90%_at_100%_100%,var(--c-pink-soft),transparent_60%)] bg-surface-2 text-brand-mid/40",
          className,
        )}
      >
        <div className="flex flex-col items-center gap-1.5">
          <Icon width={kind === "portrait" ? 64 : 40} height={kind === "portrait" ? 64 : 40} strokeWidth={1.4} />
          <span className="text-xs font-medium text-muted">{label ?? (kind === "portrait" ? "[รูปพอร์ตเทรต]" : "[รูปภาพ]")}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("relative overflow-hidden", !loaded && !img.blur && "skeleton", className)}
      style={img.blur ? { backgroundImage: `url(${img.blur})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
    >
      {!loaded && img.blur && <div aria-hidden className="skeleton absolute inset-0 opacity-40" />}
      {/* eslint-disable-next-line @next/next/no-img-element -- variants are pre-generated webp in Supabase storage */}
      <img
        src={img.src[960]}
        srcSet={`${img.src[480]} 480w, ${img.src[960]} 960w, ${img.src[1920]} 1920w`}
        sizes={sizes}
        alt={alt}
        width={img.w}
        height={img.h}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        draggable={false}
        ref={(el) => { if (el?.complete && el.naturalWidth) setLoaded(true); }}
        onLoad={() => setLoaded(true)}
        className={cn(
          "no-select absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-700 ease-out",
          loaded ? "opacity-100" : "opacity-0",
          imgClassName,
        )}
      />
    </div>
  );
}
