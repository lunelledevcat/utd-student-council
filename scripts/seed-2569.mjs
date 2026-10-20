// Seeds the 2569 council (MEMBERS_FILE, default _import/members-2569.content.json — outside git: students' personal
// data never goes into the public repo) and the banner 02 slides (content/banners-02.json) into Supabase.
// Idempotent: fixed ids derived from year + order / banner name. Re-running updates names, roles, order, group and
// files, nickname / department / party / IG handle, but never touches what the back office decides: photo consent,
// Instagram/contact consent (consent_public), hero on/off/window.
//   node scripts/seed-2569.mjs          (needs NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local)
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => /^[A-Z0-9_]+=/.test(l))
  .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]));
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL, KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ || !KEY) throw new Error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing in .env.local");

const uuid = (s) => {
  const h = createHash("sha1").update(s).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
};
async function rest(path, init = {}) {
  const r = await fetch(`${URL_}/rest/v1/${path}`, { ...init, headers: { apikey: KEY, authorization: `Bearer ${KEY}`, "content-type": "application/json", ...init.headers } });
  if (!r.ok) throw new Error(`${init.method ?? "GET"} ${path}: ${r.status} ${await r.text()}`);
  return r.status === 204 ? null : r.json().catch(() => null);
}
const insertOrUpdate = async (table, id, always, onlyNew) => {
  const [row] = await rest(`${table}?id=eq.${id}&select=id`);
  if (row) await rest(`${table}?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(always) });
  else await rest(table, { method: "POST", body: JSON.stringify({ id, ...always, ...onlyNew }) });
  return row ? "updated" : "inserted";
};

const th = JSON.parse(readFileSync("messages/th.json", "utf8")).people;
const en = JSON.parse(readFileSync("messages/en.json", "utf8")).people;
const IG = /^[A-Za-z0-9._]{1,30}$/;
const data = JSON.parse(readFileSync(env.MEMBERS_FILE || process.env.MEMBERS_FILE || "_import/members-2569.content.json", "utf8"));
const Y = data.academicYearBE;

await rest("academic_years?on_conflict=year", { method: "POST", headers: { prefer: "resolution=ignore-duplicates" }, body: JSON.stringify({ year: Y }) });

const res = { inserted: 0, updated: 0 };
for (const m of data.members) {
  if (!en.titles[m.roleKey] || !th.depts[m.deptKey] || !th.parties[m.partyKey]) throw new Error(`missing message for member ${m.order}`);
  if (m.instagram && !IG.test(m.instagram)) throw new Error(`bad Instagram handle for member ${m.order}`);
  const nn = String(m.order).padStart(2, "0");
  const r = await insertOrUpdate("members", uuid(`utd-member-${Y}-${nn}`), {
    year: Y,
    name: m.name,
    nickname: m.nickname,
    role_title: m.role, // the position as the council wrote it (displayed)
    role_title_en: en.titles[m.roleKey],
    dept: th.depts[m.deptKey],
    dept_en: en.depts[m.deptKey],
    party: th.parties[m.partyKey],
    party_en: en.parties[m.partyKey],
    instagram: m.instagram ?? "", // shown only once consent_public is switched on in the back office
    name_from_poster: m.nameFromPoster,
    role_from_doc: m.roleFromDoc,
    member_group: m.group,
    sort_order: m.order,
    photo_key: `members/${Y}/${nn}`,
    status: "approved",
  }, { consent_photo: null, contact: "", consent_public: false });
  res[r]++;
}
console.log(`members ${Y}:`, res);

// Hero slides. Order 1 is kept for banner 01 (to come).
// banner 02 = the council's artwork (SCUTD 2026 + two memorial banners): shown whole (the frame has their ratio),
// nothing drawn over them, 9 s each because they carry text. New rows start ON (orders 2-4); re-runs never touch
// on/off, order or dates.
const BANNER_ALT = [
  ["SCUTD 2026 สภานักเรียนโรงเรียนอุตรดิตถ์ ปีการศึกษา 2569", "SCUTD 2026 — Uttaradit School Student Council, academic year 2569"],
  ["น้อมรำลึกในพระมหากรุณาธิคุณ สมเด็จพระนางเจ้าสิริกิติ์ พระบรมราชินีนาถ พระบรมราชชนนีพันปีหลวง", "In remembrance of the boundless grace of Her Majesty Queen Sirikit The Queen Mother"],
  ["น้อมเสด็จสู่ทิพยสถาน สมเด็จพระเจ้าลูกเธอ เจ้าฟ้าพัชรกิติยาภา นเรนทิราเทพยวดี กรมหลวงราชสาริณีสิริพัชร มหาวัชรราชธิดา", "In remembrance of Her Royal Highness Princess Bajrakitiyabha Narendiradebyavati, Krom Luang Rajasarini Siribajra Mahavajra Rajadhita"],
];
for (const [i, b] of JSON.parse(readFileSync("content/banners-02.json", "utf8")).entries()) {
  const r = await insertOrUpdate("photos", uuid(`utd-banner02-${i + 1}`), {
    static_path: `/banners/${b.name}`, width: b.w, height: b.h, blur: b.blur, credit: "council", caption: "",
    alt_th: BANNER_ALT[i][0], alt_en: BANNER_ALT[i][1], focal: null, hero_seconds: 9, status: "approved",
  }, { is_hero: true, hero_order: i + 2 });
  console.log(`${b.name}: ${r}`);
}

// The three council group photos (brander/*.pdf) are ordinary photos in Supabase Storage (managed on /dashboard/hero);
// they are not part of the repository.
