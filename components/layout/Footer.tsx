import Link from "next/link";
import { Mandapa } from "@/components/ui/Mandapa";
import { NAV, SITE } from "@/lib/site";

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-brand-deep text-on-brand">
      <Mandapa className="no-select pointer-events-none absolute -right-10 -top-10 h-96 w-[32rem] text-brand-mid opacity-15" />
      <div className="relative mx-auto grid max-w-[1440px] gap-12 px-4 py-16 md:grid-cols-3 lg:px-20 lg:py-20">
        <div className="space-y-3">
          <p className="font-display text-3xl font-semibold">{SITE.name}</p>
          <p className="font-serif text-xl text-gold" style={{ fontFamily: "var(--font-noto-serif)" }}>{SITE.nameEn}</p>
          <p className="text-[15px] text-on-brand/85">{SITE.address}</p>
          <p className="text-[15px] text-on-brand/85">ก่อตั้ง พ.ศ. {SITE.founded}</p>
        </div>
        <nav aria-label="ลิงก์ท้ายเว็บ">
          <p className="mb-3 font-display text-lg font-semibold text-gold">เมนู</p>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-2 text-[15px]">
            {NAV.slice(1).map((n) => (
              <li key={n.href}><Link href={n.href} className="hover:text-pink-soft">{n.label}</Link></li>
            ))}
            <li><Link href="/documents" className="hover:text-pink-soft">เอกสาร</Link></li>
          </ul>
        </nav>
        <div>
          <p className="mb-3 font-display text-lg font-semibold text-gold">ติดตามสภา</p>
          <ul className="space-y-2 text-[15px]">
            {SITE.social.map((s) => (
              <li key={s.label}><a href={s.href} rel="noopener noreferrer" className="hover:text-pink-soft">{s.label} [placeholder]</a></li>
            ))}
          </ul>
        </div>
      </div>
      {/* honeypot: invisible to people, followed by scrapers -> proxy.ts bans the IP for 1h (disallowed in robots.txt) */}
      <a href="/_hp/directory" rel="nofollow noindex" tabIndex={-1} aria-hidden style={{ display: "none" }}>ทะเบียนสมาชิก</a>
      <div className="relative border-t border-brand-mid">
        <p className="mx-auto max-w-[1440px] px-4 py-6 text-sm text-on-brand/80 lg:px-20">
          © 2569 {SITE.name} · ก่อตั้ง พ.ศ. {SITE.founded}
        </p>
      </div>
    </footer>
  );
}
