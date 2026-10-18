import { MANDAPA_PATH } from "@/lib/site";

export function Mandapa({
  className,
  fill = "currentColor",
  stroke,
  strokeWidth = 1.5,
  opacity = 1,
}: {
  className?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
}) {
  return (
    <svg
      viewBox="0 0 400 300"
      className={className}
      aria-hidden
      focusable="false"
      preserveAspectRatio="xMidYMax meet"
    >
      <path d={MANDAPA_PATH} fill={fill} stroke={stroke} strokeWidth={strokeWidth} opacity={opacity} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** Kae Farang flower divider between sections. */
export function FlowerDivider() {
  return (
    <div aria-hidden className="flex items-center justify-center gap-4 py-2 text-pink">
      <span className="h-px w-16 bg-line" />
      <span className="text-xl">✿</span>
      <span className="h-px w-16 bg-line" />
    </div>
  );
}
