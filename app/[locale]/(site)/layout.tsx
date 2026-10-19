import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { ScrollTop } from "@/components/layout/ScrollTop";
import { SkipLink } from "@/components/layout/SkipLink";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mesh-top flex min-h-dvh flex-col">
      <SkipLink />
      <Navbar />
      <main id="main" className="flex-1">{children}</main>
      <Footer />
      <ScrollTop />
    </div>
  );
}
