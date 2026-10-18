import type { Metadata } from "next";
import Link from "next/link";
import { Petals } from "@/components/ui/Petals";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative isolate grid min-h-dvh place-items-center overflow-hidden bg-gradient-to-br from-brand-deep via-brand to-brand-mid px-4 py-10 text-on-brand">
      <Petals />
      <div className="relative w-full max-w-md space-y-6 rounded-lg border border-white/15 bg-surface p-8 text-ink shadow-soft">
        <Link href="/" className="flex items-center gap-3" aria-label="กลับหน้าแรก">
          <span className="no-select grid h-11 w-11 place-items-center rounded-full bg-gold font-display text-sm font-semibold text-brand-deep" title="[ใส่โลโก้สภานักเรียน]">{SITE.abbr}</span>
          <span className="font-display text-lg font-semibold text-strong">{SITE.name}</span>
        </Link>
        {children}
      </div>
    </main>
  );
}
