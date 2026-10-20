import { headers } from "next/headers";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { ScrollTop } from "@/components/layout/ScrollTop";
import { SkipLink } from "@/components/layout/SkipLink";
import { schoolJsonLd } from "@/lib/school-info";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  // structured data (school name, address, telephone — nothing else); static config, "<" escaped
  const ld = JSON.stringify(schoolJsonLd(process.env.NEXT_PUBLIC_SITE_URL ?? "https://utdsc.com")).replace(/</g, "\\u003c");
  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink />
      <Navbar />
      <main id="main" className="flex-1">{children}</main>
      <Footer />
      <ScrollTop />
      <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: ld }} />
    </div>
  );
}
