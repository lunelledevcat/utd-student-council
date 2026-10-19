// One icon component for the whole site. Glyphs: Phosphor Icons (MIT, duotone weight); brand marks: Simple Icons (CC0).
// The duotone fill layer is coloured pink in globals.css (.ico), the outline uses currentColor — so icons read
// navy/white + pink everywhere. Uses the `ssr` entry (no React context) so it renders in server and client components.
import {
  ArrowCounterClockwise, ArrowLeft, ArrowSquareOut, ArrowUp, ArrowsOut, CalendarBlank, CaretDown, CaretLeft, CaretRight,
  ChalkboardTeacher, Check, Crown, Flag, Globe, List, Image as ImageIcon, Images, Info, LinkSimple, MagnifyingGlass, Medal, Megaphone, PushPin,
  Star, User, UsersThree, X,
} from "@phosphor-icons/react/ssr";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import { siFacebook, siInstagram } from "simple-icons";
import { cn } from "@/lib/utils";

const GLYPHS = {
  search: MagnifyingGlass, calendar: CalendarBlank, link: LinkSimple, external: ArrowSquareOut, close: X,
  chevronLeft: CaretLeft, chevronRight: CaretRight, chevronDown: CaretDown, arrowUp: ArrowUp, arrowLeft: ArrowLeft,
  crown: Crown, medal: Medal, star: Star, pin: PushPin, megaphone: Megaphone, images: Images, image: ImageIcon, flag: Flag,
  users: UsersThree, teacher: ChalkboardTeacher, info: Info, expand: ArrowsOut, reset: ArrowCounterClockwise, user: User,
  globe: Globe, check: Check, menu: List,
} satisfies Record<string, PhosphorIcon>;
const BRANDS = { facebook: siFacebook, instagram: siInstagram };

export type IconName = keyof typeof GLYPHS | keyof typeof BRANDS;

export type IconProps = {
  name: IconName;
  size?: number;
  className?: string;
  /** "fill" for solid glyphs on small badges; default duotone */
  weight?: "duotone" | "fill" | "bold";
  label?: string;
};

export function Icon({ name, size = 20, className, weight = "duotone", label }: IconProps) {
  const a11y = label ? { role: "img", "aria-label": label } : { "aria-hidden": true as const };
  if (name in BRANDS) {
    const b = BRANDS[name as keyof typeof BRANDS];
    return (
      <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className={cn("ico shrink-0", className)} {...a11y}>
        <path d={b.path} />
      </svg>
    );
  }
  const G = GLYPHS[name as keyof typeof GLYPHS];
  return <G size={size} weight={weight} className={cn("ico shrink-0", className)} {...a11y} />;
}

// Named aliases keep call sites short and typed: <IconSearch width={16} /> === <Icon name="search" size={16} />.
type Legacy = { width?: number; height?: number; className?: string; strokeWidth?: number };
const alias = (name: IconName, weight?: IconProps["weight"]) => {
  const C = ({ width, className }: Legacy) => <Icon name={name} size={width} className={className} weight={weight} />;
  C.displayName = `Icon(${name})`;
  return C;
};
export const IconFacebook = alias("facebook");
export const IconInstagram = alias("instagram");
export const IconSearch = alias("search");
export const IconCalendar = alias("calendar");
export const IconLink = alias("link");
export const IconExternal = alias("external");
export const IconClose = alias("close", "bold");
export const IconChevronLeft = alias("chevronLeft", "bold");
export const IconChevronRight = alias("chevronRight", "bold");
export const IconChevronDown = alias("chevronDown", "bold");
export const IconArrowUp = alias("arrowUp", "bold");
export const IconArrowLeft = alias("arrowLeft", "bold");
export const IconCrown = alias("crown", "fill");
export const IconMedal = alias("medal", "fill");
export const IconStar = alias("star");
export const IconPin = alias("pin");
export const IconMegaphone = alias("megaphone");
export const IconImages = alias("images");
export const IconImage = alias("image");
export const IconFlag = alias("flag");
export const IconUsers = alias("users");
export const IconTeacher = alias("teacher");
export const IconInfo = alias("info");
export const IconExpand = alias("expand");
export const IconReset = alias("reset");
export const IconUser = alias("user");
