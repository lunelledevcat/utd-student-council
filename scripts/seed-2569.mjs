// Seeds the 2569 council (content/members-2569.json) and the banner 02 slides (content/banners-02.json) into Supabase.
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
const data = JSON.parse(readFileSync("content/members-2569.json", "utf8"));
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

// banner 02 — the three images as delivered; off until staff turn them on (dashboard -> hero). Order 1 = banner 01 (to come).
const ALT = [
  ["คณะกรรมการสภานักเรียนโรงเรียนอุตรดิตถ์ ถ่ายภาพหมู่หน้าอาคารเรียน", "Uttaradit School Student Council group photo in front of a school building"],
  ["คณะกรรมการสภานักเรียนโรงเรียนอุตรดิตถ์ ในชุดสูทสภานักเรียน ถ่ายภาพหมู่", "Uttaradit School Student Council members in council blazers, group photo"],
  ["คณะกรรมการสภานักเรียนโรงเรียนอุตรดิตถ์ ในเสื้อสภานักเรียนสีม่วง ถ่ายภาพหมู่ที่สนาม", "Uttaradit School Student Council members in purple council shirts, group photo on the field"],
];
// focal point for filling the banner frame (object-position), chosen so every face stays in view at 16:7 and 4:3
const FOCAL = ["50% 64%", "50% 45%", "50% 53%"];
const banners = JSON.parse(readFileSync("content/banners-02.json", "utf8"));
for (const [i, b] of banners.entries()) {
  const r = await insertOrUpdate("photos", uuid(`utd-banner-${b.name}`), {
    static_path: `/banners/${b.name}`, width: b.w, height: b.h, blur: b.blur, credit: "council", caption: "",
    alt_th: ALT[i][0], alt_en: ALT[i][1], focal: FOCAL[i], status: "approved",
  }, { is_hero: false, hero_order: i + 2 });
  console.log(`${b.name}: ${r}`);
}
