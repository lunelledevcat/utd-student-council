// Fixed, non-translatable site settings. Every visible text lives in messages/<locale>.json.
export const SITE = {
  founded: 2452,
  facebook: "#", // [placeholder] URL เพจ Facebook
  instagram: "#", // [placeholder] URL Instagram
} as const;

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
