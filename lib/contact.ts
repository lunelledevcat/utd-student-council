// The council's official public channels — the ONE place to change them (header links, phone dock).
// No e-mail here: the council's addresses are back-office sign-in accounts, not public contacts.
// Links only: nothing is fetched from Facebook / Instagram / TikTok.
// Instagram "utd_scc" is still waiting for confirmation against "utd_stdcc" — change it here only.

export const CHANNELS = [
  { key: "instagram", label: "@utd_scc", href: "https://www.instagram.com/utd_scc/" },
  { key: "facebook", label: "สภานักเรียนโรงเรียนอุตรดิตถ์", href: "https://www.facebook.com/share/19oUgcDyny/" },
  { key: "tiktok", label: "@utd.sc", href: "https://www.tiktok.com/@utd.sc" },
] as const;
export type Channel = (typeof CHANNELS)[number];

