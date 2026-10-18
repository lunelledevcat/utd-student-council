import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { Preloader } from "@/components/layout/Preloader";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#main" className="sr-only z-[200] rounded bg-pink px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        ข้ามไปยังเนื้อหา
      </a>
      <Preloader />
      <Navbar />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}
