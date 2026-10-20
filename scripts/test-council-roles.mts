// Council roles (lib/council.ts): Thai title -> role, and grouping into department sections.
// Run: npm run test:council   (Node >= 23 runs TypeScript directly)
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { groupByDepartment, roleFromTitle, type CouncilRole, type Department } from "../lib/council.ts";

// 1. title -> role ("รอง…" forms first: they contain "ประธาน" / "หัวหน้า")
const titles: [string, CouncilRole][] = [
  ["ประธานนักเรียนคณะกรรมการสภานักเรียน", "president"],
  ["ประธานคณะกรรมการสภานักเรียน", "president"],
  ["รองประธานคณะกรรมการสภานักเรียนฝ่ายบริหารทั่วไป", "vice_president"],
  ["  รองประธาน ฝ่ายบริหารวิชาการ", "vice_president"],
  ["หัวหน้าฝ่ายเลขานุการ", "head"],
  ["หัวหน้าฝ่ายโสตทัศนศึกษา", "head"],
  ["รองหัวหน้าฝ่ายประชาสัมพันธ์", "deputy_head"],
  ["รอง หัวหน้าฝ่ายสวัสดิการ", "deputy_head"],
  ["เลขานุการ", "member"],
  ["กรรมการฝ่ายกิจกรรม", "member"],
  ["", "member"],
];
for (const [title, want] of titles) assert.equal(roleFromTitle(title), want, JSON.stringify(title));

// 2. sections follow the department file's order; people in role order, then stored order
const depts: Department[] = JSON.parse(readFileSync(new URL("../content/council-departments.json", import.meta.url), "utf8")).departments;
assert.equal(depts.length, 12);
assert.deepEqual(depts.slice(0, 2).map((d) => d.key), ["executive", "policy"]);
const other: Department = { key: "other", th: "อื่น ๆ", en: "Other", pendingDeputies: 0 };
const p = (id: string, deptKey: string | null, councilRole: CouncilRole, rank: number) => ({ id, deptKey, councilRole, rank });
const people = [
  p("v2", "executive", "vice_president", 3), p("pr", "executive", "president", 9), p("v1", "executive", "vice_president", 2),
  p("dep", "policy", "deputy_head", 1), p("head", "policy", "head", 7),
  p("pr-head", "publicRelations", "head", 8),
  p("lost", "nope", "member", 1),
];
const s = groupByDepartment(people, depts, other);
assert.deepEqual(s[0].people.map((x) => x.id), ["pr", "v1", "v2"]);
assert.equal(s[0].pendingDeputies, 0); // executive: none configured
assert.deepEqual(s[1].people.map((x) => x.id), ["head", "dep"]);
assert.equal(s[1].pendingDeputies, 0); // has a deputy already
assert.equal(s[2].dept.key, "publicRelations");
assert.equal(s[2].pendingDeputies, 1); // no deputy yet -> one "to be announced" card
assert.equal(s.at(-1)!.dept.key, "other");
assert.deepEqual(s.at(-1)!.people.map((x) => x.id), ["lost"]);
assert.equal(s.length, 13); // 12 departments (empty ones still show their placeholder) + other
// while searching: no placeholders, so departments without people disappear
const q = groupByDepartment(people, depts, other, false);
assert.deepEqual(q.map((x) => x.dept.key), ["executive", "policy", "publicRelations", "other"]);
assert.ok(q.every((x) => x.pendingDeputies === 0));
// pendingDeputies 0 in the file hides the placeholder
assert.equal(groupByDepartment([], [{ ...depts[1], pendingDeputies: 0 }], other).length, 0);

console.log(`council roles ok — ${titles.length} titles + grouping`);
