import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Thai, Kanit, Noto_Serif_Thai } from "next/font/google";
import "./globals.css";
import { SITE } from "@/lib/site";

const kanit = Kanit({
  variable: "--font-kanit",
  subsets: ["thai", "latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});
const plex = IBM_Plex_Sans_Thai({
  variable: "--font-plex",
  subsets: ["thai", "latin"],
  weight: ["400", "500"],
  display: "swap",
});
const notoSerif = Noto_Serif_Thai({
  variable: "--font-noto-serif",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: SITE.name, template: `%s · ${SITE.name}` },
  description: SITE.description,
  openGraph: {
    type: "website",
    locale: "th_TH",
    siteName: SITE.name,
    title: SITE.name,
    description: SITE.description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0b1f4d",
  colorScheme: "light dark",
};

// Per-request CSP nonce (set in proxy.ts) requires dynamic rendering.
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="th"
      className={`${kanit.variable} ${plex.variable} ${notoSerif.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
