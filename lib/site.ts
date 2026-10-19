// Fixed, non-translatable site settings. Every visible text lives in messages/<locale>.json.
export const SITE = {
  founded: 2452,
} as const;

/**
 * The council's official channels — the ONE place to change them (header, footer, home page read this).
 * Links only: nothing is fetched from Facebook / Instagram / TikTok.
 * instagram: "utd_scc" is waiting for confirmation against "utd_stdcc" — change the handle here only.
 */
export const CHANNELS = [
  { key: "facebook", label: "สภานักเรียนโรงเรียนอุตรดิตถ์", href: "https://www.facebook.com/share/19oUgcDyny/" },
  { key: "instagram", label: "@utd_scc", href: "https://www.instagram.com/utd_scc/" },
  { key: "tiktok", label: "@utd.sc", href: "https://www.tiktok.com/@utd.sc" },
] as const;
export type Channel = (typeof CHANNELS)[number];

/** Voice categories: stored value (Thai, kept for existing rows) -> message key under voice.categories. */
export const VOICE_CATEGORIES = {
  การเรียน: "learning",
  กิจกรรม: "activities",
  สิ่งแวดล้อม: "environment",
  สวัสดิการ: "welfare",
  อื่นๆ: "other",
} as const;
export type VoiceCategory = keyof typeof VOICE_CATEGORIES;
export const VOICE_CATEGORY_VALUES = Object.keys(VOICE_CATEGORIES) as [VoiceCategory, ...VoiceCategory[]];
