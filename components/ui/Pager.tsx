import Link from "next/link";
import { cn } from "@/lib/utils";

export function Pager({ base, page, pages }: { base: string; page: number; pages: number }) {
  if (pages <= 1) return null;
  return (
    <nav aria-label="เปลี่ยนหน้า" className="mt-12 flex flex-wrap justify-center gap-2">
      {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
        <Link
          key={p}
          href={p === 1 ? base : `${base}?page=${p}`}
          aria-current={p === page ? "page" : undefined}
          className={cn("grid h-11 min-w-11 place-items-center rounded-full border px-3 font-medium", p === page ? "border-brand bg-brand text-on-brand" : "border-line bg-surface hover:border-pink")}
        >
          {p}
        </Link>
      ))}
    </nav>
  );
}
