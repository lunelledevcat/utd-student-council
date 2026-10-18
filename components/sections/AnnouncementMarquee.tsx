const ITEMS = [
  "[ประกาศด่วน 1 — ใส่ข้อความจริง]",
  "[ประกาศด่วน 2 — ใส่ข้อความจริง]",
  "[ประกาศด่วน 3 — ใส่ข้อความจริง]",
  "[ประกาศด่วน 4 — ใส่ข้อความจริง]",
];

/** Scrolling urgent notices. Pauses on hover; static when reduced motion is on. */
export function AnnouncementMarquee() {
  const row = (suffix: string) =>
    ITEMS.map((t, i) => (
      <span key={suffix + i} className="flex shrink-0 items-center gap-8">
        <span>{t}</span>
        <span aria-hidden className="text-pink">✿</span>
      </span>
    ));
  return (
    <div className="marquee flex items-center gap-6 overflow-hidden bg-brand-deep px-4 py-4 text-on-brand lg:px-20" role="region" aria-label="ประกาศด่วน">
      <span className="shrink-0 rounded-full bg-pink px-4 py-1 font-display text-[17px] font-semibold text-white">ประกาศด่วน</span>
      <div className="relative flex-1 overflow-hidden">
        <div className="marquee-track flex w-max gap-8 text-[15px]">
          {row("a")}
          <span aria-hidden className="contents">{row("b")}</span>
        </div>
      </div>
    </div>
  );
}
