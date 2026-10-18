import Link from "next/link";
import { Mandapa } from "@/components/ui/Mandapa";
import { NAV, SITE } from "@/lib/site";

export function Footer() {
  return (
    <footer className="relative mt-8 overflow-hidden border-t border-white/10 bg-gradient-to-br from-brand-deep to-brand text-center text-on-brand">
      <Mandapa className="no-select pointer-events-none absolute -right-10 -top-6 h-72 w-[24rem] text-brand-mid opacity-15" />
      <div className="relative mx-auto max-w-[1320px] space-y-3 px-3 py-6 text-[0.9rem]">
        <p className="font-display text-base font-medium">© 2569 {SITE.name}</p>
        <nav aria-label="ลิงก์ท้ายเว็บ">
          <ul className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-on-brand/85">
            {NAV.slice(1).map((n) => (
              <li key={n.href}><Link href={n.href} className="hover:text-pink-soft">{n.label}</Link></li>
            ))}
            <li><Link href="/policies" className="hover:text-pink-soft">นโยบาย</Link></li>
            <li><Link href="/documents" className="hover:text-pink-soft">เอกสาร</Link></li>
            <li><Link href="/login" className="hover:text-pink-soft">เข้าสู่ระบบ</Link></li>
          </ul>
        </nav>
        <ul className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-on-brand/85">
          {SITE.social.map((s) => (
            <li key={s.label}><a href={s.href} rel="noopener noreferrer" className="hover:text-pink-soft">{s.label} [placeholder]</a></li>
          ))}
        </ul>
        <p className="text-on-brand/75">จัดทำและพัฒนาเว็บไซต์โดย [ทีมสภานักเรียน — ใส่ชื่อผู้จัดทำ]</p>
        {/* honeypot: invisible to people, followed by scrapers -> proxy.ts bans the IP for 1h (disallowed in robots.txt) */}
        <a href="/_hp/directory" rel="nofollow noindex" tabIndex={-1} aria-hidden style={{ display: "none" }}>ทะเบียนสมาชิก</a>
        <div className="border-t border-white/15 pt-3 text-on-brand/75">
          <p>{SITE.school} · ก่อตั้ง พ.ศ. {SITE.founded}</p>
          <p>{SITE.address}</p>
        </div>
      </div>
    </footer>
  );
}
