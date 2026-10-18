import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { ScrollTop } from "@/components/layout/ScrollTop";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mesh-top flex min-h-dvh flex-col">
      <a href="#main" className="sr-only z-[200] rounded bg-pink px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        ข้ามไปยังเนื้อหา
      </a>
      <Navbar />
      <main id="main" className="flex-1">{children}</main>
      <Footer />
      <ScrollTop />
    </div>
  );
}
