// The council's official contact channels — the ONE place to change them (header links, phone dock).
// Links only: nothing is fetched from Facebook / Instagram / TikTok.
// Instagram "utd_scc" is still waiting for confirmation against "utd_stdcc" — change it here only.

export const CHANNELS = [
  { key: "instagram", label: "@utd_scc", href: "https://www.instagram.com/utd_scc/" },
  { key: "facebook", label: "สภานักเรียนโรงเรียนอุตรดิตถ์", href: "https://www.facebook.com/share/19oUgcDyny/" },
  { key: "tiktok", label: "@utd.sc", href: "https://www.tiktok.com/@utd.sc" },
] as const;
export type Channel = (typeof CHANNELS)[number];

/**
 * E-mail addresses, kept as [local part, domain] so no complete address exists in the server-rendered HTML, the
 * sitemap or structured data. The phone dock joins them in the browser only when the e-mail item is opened.
 */
export const EMAIL_PARTS: readonly (readonly [string, string])[] = [
  ["scutd", "utd.ac.th"],
  ["it40810", "utd.ac.th"],
];
export const joinEmail = ([local, domain]: readonly [string, string]) => `${local}@${domain}`;
