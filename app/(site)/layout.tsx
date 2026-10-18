import { Footer } from "@/components/layout/Footer";
import { HomeOnly } from "@/components/layout/HomeOnly";
import { Navbar } from "@/components/layout/Navbar";
import { Preloader } from "@/components/layout/Preloader";
import { ScrollTop } from "@/components/layout/ScrollTop";
import { TabNav } from "@/components/layout/TabNav";
import { Hero } from "@/components/sections/Hero";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#main" className="sr-only z-[200] rounded bg-pink px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        ข้ามไปยังเนื้อหา
      </a>
      <Preloader />
      <Navbar />
      <HomeOnly><Hero /></HomeOnly>
      <TabNav />
      <main id="main">{children}</main>
      <Footer />
      <ScrollTop />
    </>
  );
}
