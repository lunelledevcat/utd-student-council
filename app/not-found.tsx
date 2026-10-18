import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { Petals } from "@/components/ui/Petals";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="relative isolate grid min-h-dvh place-items-center overflow-hidden bg-gradient-to-br from-brand-deep to-brand-mid px-4 text-center text-on-brand">
        <Petals />
        <div className="relative space-y-5">
          <p className="font-serif text-8xl font-bold text-gold" style={{ fontFamily: "var(--font-noto-serif)" }}>404</p>
          <h1 className="text-4xl font-bold">ไม่พบหน้าที่คุณต้องการ</h1>
          <p className="text-pink-soft">หน้านี้อาจถูกย้ายหรือไม่มีอยู่แล้ว</p>
          <Link href="/" className="inline-block rounded-full bg-pink px-8 py-3.5 font-display text-lg font-semibold text-white hover:shadow-glow">กลับหน้าแรก</Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
