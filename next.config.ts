import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

// Static security headers. CSP (with per-request nonce) is set in proxy.ts.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Robots-Tag", value: "noai, noimageai" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  reactStrictMode: true,
  async redirects() {
    // v2 single page: old section routes -> matching tab (with or without a locale prefix; proxy.ts adds the prefix)
    const old: [string, string][] = [
      ["/news/:path*", ""], ["/events/:path*", ""], ["/contact", ""], ["/documents", ""],
      ["/members", "?tab=council"], ["/team", "?tab=council"], ["/council", "?tab=council"], ["/about", "?tab=council"],
      ["/policies", "?tab=policy"], ["/advisors", "?tab=advisor"],
    ];
    return old.flatMap(([from, q]) => [
      { source: from, destination: `/${q}`, permanent: true },
      { source: `/:locale(th|en)${from}`, destination: `/:locale${q}`, permanent: true },
    ]);
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withNextIntl(nextConfig);

// `next dev`: expose the Cloudflare bindings (D1, R2, KV) from wrangler.jsonc, simulated locally
initOpenNextCloudflareForDev();
