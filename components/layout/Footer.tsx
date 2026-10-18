import Link from "next/link";
import { SITE } from "@/lib/site";

export function Footer() {
  return (
    <footer className="relative mt-14 overflow-hidden bg-gradient-to-br from-brand-deep via-[#0a1a40] to-[#0e2a66] text-center text-on-brand">
      <span aria-hidden className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-pink to-transparent" />
      <span aria-hidden className="pointer-events-none absolute -left-24 -bottom-24 h-64 w-64 rounded-full bg-pink/15 blur-3xl" />
      <div className="relative mx-auto max-w-[1320px] space-y-2 px-4 py-8 text-[0.88rem]">
        <p className="font-display text-base font-medium">© คณะกรรมการสภานักเรียน {SITE.school}</p>
        <p className="text-on-brand/65">{SITE.address}</p>
        <p className="flex flex-wrap justify-center gap-x-4 gap-y-1 pt-1 text-on-brand/70">
          <Link href="/voice" className="hover:text-pink-400">ส่งเสียงถึงสภา</Link>
          <Link href="/login" className="hover:text-pink-400">เข้าสู่ระบบหลังบ้าน</Link>
        </p>
        {/* honeypot: invisible to people, followed by scrapers -> proxy.ts bans the IP for 1h (disallowed in robots.txt) */}
        <a href="/_hp/directory" rel="nofollow noindex" tabIndex={-1} aria-hidden style={{ display: "none" }}>ทะเบียนสมาชิก</a>
      </div>
    </footer>
  );
}
