// Fails when messages/th.json and messages/en.json do not have exactly the same keys,
// when a value is empty, or when the {placeholders} of a key look like a typo (neither language's set contains the
// other's — one language may legitimately use fewer, e.g. the Thai year label shows only the Buddhist-era year).
// Usage: npm run i18n:check
import { readFileSync } from "node:fs";

const load = (l) => JSON.parse(readFileSync(new URL(`../messages/${l}.json`, import.meta.url), "utf8"));
const flat = (o, p = "", out = {}) => {
  for (const [k, v] of Object.entries(o)) {
    const key = p ? `${p}.${k}` : k;
    if (v && typeof v === "object") flat(v, key, out);
    else out[key] = String(v);
  }
  return out;
};
// top-level ICU argument names only ({n, plural, ...} -> n)
const args = (s) => new Set([...s.matchAll(/\{\s*([A-Za-z_][\w]*)\s*[,}]/g)].map((m) => m[1]));

const th = flat(load("th"));
const en = flat(load("en"));
const errors = [];
for (const k of Object.keys(th)) if (!(k in en)) errors.push(`missing in en: ${k}`);
for (const k of Object.keys(en)) if (!(k in th)) errors.push(`missing in th: ${k}`);
for (const [k, v] of Object.entries({ ...th, ...en })) if (!v.trim()) errors.push(`empty value: ${k}`);
for (const k of Object.keys(th)) {
  if (!(k in en)) continue;
  const a = args(th[k]), b = args(en[k]);
  const sub = (x, y) => [...x].every((v) => y.has(v));
  if (!sub(a, b) && !sub(b, a)) errors.push(`placeholders differ for ${k}: th {${[...a]}} / en {${[...b]}}`);
}
if (errors.length) {
  console.error(errors.join("\n"));
  console.error(`\n${errors.length} problem(s)`);
  process.exit(1);
}
console.log(`i18n ok — ${Object.keys(th).length} keys in th and en`);
