export const SITE = {
  name: "สภานักเรียนโรงเรียนอุตรดิตถ์",
  nameEn: "Uttaradit School Student Council",
  school: "โรงเรียนอุตรดิตถ์",
  schoolEn: "Uttaradit School",
  abbr: "อ.ต.",
  founded: 2452,
  term: "[25xx]", // [placeholder] ปีวาระ
  slogan: "[สโลแกนสภานักเรียน]", // [placeholder]
  description:
    "เว็บไซต์สภานักเรียนโรงเรียนอุตรดิตถ์ — นโยบาย ข่าว กิจกรรม และช่องทางส่งเสียงถึงสภา",
  address: "15 ถ.อินใจมี-ประชานิมิตร ต.ท่าอิฐ อ.เมือง จ.อุตรดิตถ์",
  social: [
    { label: "Facebook", href: "#" }, // [placeholder]
    { label: "Instagram", href: "#" }, // [placeholder]
    { label: "เว็บไซต์โรงเรียน", href: "#" }, // [placeholder]
  ],
} as const;

export const NAV = [
  { label: "หน้าแรก", href: "/" },
  { label: "สภานักเรียน", href: "/council" },
  { label: "สมาชิก", href: "/members" },
  { label: "ข่าว", href: "/news" },
  { label: "กิจกรรม", href: "/events" },
  { label: "ส่งเสียง", href: "/voice" },
  { label: "ติดต่อ", href: "/contact" },
] as const;

export const VOICE_CATEGORIES = ["การเรียน", "กิจกรรม", "สิ่งแวดล้อม", "สวัสดิการ", "อื่นๆ"] as const;

export const MILESTONES = [
  { year: "2452", text: "ก่อตั้งที่บริเวณวัดท่าถนน" },
  { year: "2471", text: "ย้ายไปบริเวณ ร.ร.อนุบาลอุตรดิตถ์" },
  { year: "2484", text: "ย้ายมาที่ตั้งปัจจุบัน" },
  { year: "2495", text: "เปลี่ยนชื่อเป็น “โรงเรียนอุตรดิตถ์”" },
  { year: "2506", text: "เปิดสอน ม.ปลาย" },
  { year: "ปัจจุบัน", text: "[รายละเอียดปัจจุบัน — ใส่ข้อมูลจริง]" },
];

/** Mandapa Phra Thaen Sila At silhouette (stylised, 400x300 box). Replace with the official artwork. */
export const MANDAPA_PATH =
  "M 20 300 L 20 250 L 60 250 L 60 215 L 100 215 L 100 180 L 140 180 L 140 140 L 175 140 L 175 100 L 190 100 L 200 40 L 210 100 L 225 100 L 225 140 L 260 140 L 260 180 L 300 180 L 300 215 L 340 215 L 340 250 L 380 250 L 380 300 Z";
