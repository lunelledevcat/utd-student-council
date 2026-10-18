import type { NextConfig } from "next";

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
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  reactStrictMode: true,
  async redirects() {
    return [
      // v2 single page: old section routes -> matching tab
      { source: "/news/:path*", destination: "/", permanent: true },
      { source: "/events/:path*", destination: "/", permanent: true },
      { source: "/members", destination: "/?tab=council", permanent: true },
      { source: "/team", destination: "/?tab=council", permanent: true },
      { source: "/council", destination: "/?tab=council", permanent: true },
      { source: "/about", destination: "/?tab=council", permanent: true },
      { source: "/policies", destination: "/?tab=policy", permanent: true },
      { source: "/advisors", destination: "/?tab=advisor", permanent: true },
      { source: "/contact", destination: "/", permanent: true },
      { source: "/documents", destination: "/", permanent: true },
    ];
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

export default nextConfig;
