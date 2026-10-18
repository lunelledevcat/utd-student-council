export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const TH_MONTHS = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

/** "2026-10-18" -> "18 ต.ค. 2569" (Buddhist era). */
export function thaiDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${TH_MONTHS[m - 1]} ${y + 543}`;
}

export function thaiDay(iso: string) {
  return String(Number(iso.slice(8, 10)));
}
export function thaiMonth(iso: string) {
  return TH_MONTHS[Number(iso.slice(5, 7)) - 1];
}

/** Split Thai text into words so animations never cut vowels/tone marks. */
export function thaiWords(text: string): string[] {
  const seg = new Intl.Segmenter("th", { granularity: "word" });
  const out: string[] = [];
  for (const s of seg.segment(text)) out.push(s.segment);
  return out;
}
