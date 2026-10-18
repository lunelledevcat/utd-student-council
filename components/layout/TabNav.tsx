"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// Main menu = the reference's pill tabs. Pages not listed here (contact, documents) live in the menu overlay + footer.
const TABS = [
  { label: "ข่าว & กิจกรรม", href: "/", also: ["/news", "/events"] },
  { label: "นโยบาย", href: "/policies", also: [] },
  { label: "ทีมงาน", href: "/team", also: [] },
  { label: "เกี่ยวกับสภา", href: "/about", also: [] },
  { label: "ส่งเสียงถึงสภา", href: "/voice", also: [] },
];

export function TabNav() {
  const pathname = usePathname();
  const isActive = (t: (typeof TABS)[number]) =>
    t.href === "/" ? pathname === "/" || t.also.some((p) => pathname.startsWith(p)) : pathname.startsWith(t.href);

  return (
    <div className="mx-auto mt-2.5 max-w-[1320px] px-3 md:mt-4">
      <nav aria-label="หมวดเนื้อหา" className="relative rounded-lg border border-line bg-surface p-4 shadow-soft md:p-[26px]">
        <span aria-hidden className="absolute inset-x-4 top-0 h-[3px] rounded-b bg-gradient-to-r from-brand to-pink md:inset-x-[26px]" />
        <ul className="flex flex-col gap-1.5 rounded-[14px] border border-line bg-brand/5 p-1.5 md:flex-row md:gap-1">
          {TABS.map((t) => {
            const active = isActive(t);
            return (
              <li key={t.href} className="md:flex-1">
                <Link
                  href={t.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "block rounded-[10px] px-3 py-2.5 text-center text-[0.85rem] font-medium transition-colors md:whitespace-nowrap",
                    active ? "bg-brand text-on-brand shadow-soft" : "text-muted hover:text-strong",
                  )}
                >
                  {t.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
