export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const DATE_FMT: Record<string, Intl.DateTimeFormat> = {
  th: new Intl.DateTimeFormat("th-TH-u-ca-buddhist", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }),
  en: new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }),
};

/** "2026-10-16" -> th "16 ต.ค. 2569" (Buddhist era) / en "16 Oct 2026". */
export function formatDate(iso: string, locale: string) {
  const t = Date.parse(`${iso}T00:00:00Z`);
  if (Number.isNaN(t)) return iso;
  if (locale !== "en") return DATE_FMT.th.format(t);
  // en-US parts reassembled day-first: "16 Oct 2026" (en-GB would print "Sept")
  const p = Object.fromEntries(DATE_FMT.en.formatToParts(t).map((x) => [x.type, x.value]));
  return `${p.day} ${p.month} ${p.year}`;
}

/** Buddhist-era year -> Common-era year. */
export const ceYear = (be: number) => be - 543;

/** Split text into words for word-by-word animation; Intl.Segmenter keeps Thai vowels/tone marks with their word. */
export function words(text: string, locale: string): string[] {
  const seg = new Intl.Segmenter(locale, { granularity: "word" });
  return Array.from(seg.segment(text), (s) => s.segment);
}
