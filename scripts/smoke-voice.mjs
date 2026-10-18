// Smoke test for the /voice server action (progressive-enhancement POST). Usage: node scripts/smoke-voice.mjs [baseUrl]
const base = process.argv[2] ?? "http://localhost:3000";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130 Safari/537.36";
const decode = (s) => s.replaceAll("&quot;", '"').replaceAll("&amp;", "&");

const html = await (await fetch(`${base}/voice`, { headers: { "user-agent": UA } })).text();
const hidden = {};
for (const m of html.matchAll(/<input type="hidden" name="([^"]+)"(?: value="([^"]*)")?/g)) hidden[m[1]] = decode(m[2] ?? "");

async function submit(fields) {
  const fd = new FormData();
  for (const [k, v] of Object.entries({ ...hidden, ...fields })) fd.append(k, v);
  const r = await fetch(`${base}/voice`, { method: "POST", body: fd, headers: { "user-agent": UA, origin: base, referer: `${base}/voice` } });
  const out = decode(await r.text());
  const state = out.match(/name="\$ACTION_1:1" value="(\[\{.*?\}\])"/)?.[1];
  return { status: r.status, state: state ? JSON.parse(state)[0] : null };
}

const good = { category: "การเรียน", message: "ข้อความทดสอบสำหรับระบบส่งเสียงถึงสภา", anonymous: "on", website: "" };
console.log("valid      ", await submit(good));
console.log("too short  ", await submit({ ...good, message: "สั้น" }));
console.log("honeypot   ", await submit({ ...good, website: "http://spam" }));
console.log("bad category", await submit({ ...good, category: "x" }));
console.log("4th (rate) ", await submit(good));
