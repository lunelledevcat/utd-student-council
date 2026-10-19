// Layout regression check in real Chrome (CDP, no extra dependencies — Node >= 22 has a global WebSocket).
// For each viewport: horizontal overflow (scrollWidth vs clientWidth + the elements sticking out), cumulative layout
// shift while scrolling, announcement cards' alignment, number of tab highlights, sticky bar jitter. Saves screenshots.
//
//   node scripts/check-layout.mjs [baseUrl=http://localhost:3000/th] [outDir=../utd-shots/compare/bugfix] [label=after]
//
// Exit code 1 when any check fails. Chrome path: CHROME env var or the default Windows install.
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = process.argv[2] ?? "http://localhost:3000/th";
const OUT = process.argv[3] ?? new URL("../../utd-shots/compare/bugfix", import.meta.url).pathname.replace(/^\/(\w:)/, "$1");
const LABEL = process.argv[4] ?? "after";
const CHROME = process.env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36";
const VIEWPORTS = [
  { name: "1366", width: 1366, height: 768, mobile: false },
  { name: "1440", width: 1440, height: 900, mobile: false },
  { name: "1920", width: 1920, height: 1080, mobile: false },
  { name: "390", width: 390, height: 844, mobile: true },
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const port = 9300 + Math.floor(Math.random() * 500);
const profile = mkdtempSync(join(tmpdir(), "utd-cdp-"));
const chrome = spawn(CHROME, [`--remote-debugging-port=${port}`, "--headless=new", `--user-data-dir=${profile}`, `--user-agent=${UA}`, "--no-first-run", "--hide-scrollbars", "about:blank"], { stdio: "ignore" });

async function target() {
  for (let i = 0; i < 50; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const page = list.find((t) => t.type === "page");
      if (page) return page.webSocketDebuggerUrl;
    } catch { /* not up yet */ }
    await sleep(200);
  }
  throw new Error("chrome did not start");
}

const ws = new WebSocket(await target());
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let seq = 0;
const pending = new Map();
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m);
    pending.delete(m.id);
  }
});
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++seq;
  pending.set(id, (m) => (m.error ? reject(new Error(`${method}: ${m.error.message}`)) : resolve(m.result)));
  ws.send(JSON.stringify({ id, method, params }));
});
const evaluate = async (expr) => (await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true })).result.value;

// collected from the first paint on: layout shifts not caused by input
await send("Page.enable");
await send("Page.addScriptToEvaluateOnNewDocument", {
  source: `window.__cls = 0; window.__shifts = [];
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) { window.__cls += e.value;
      window.__shifts.push({ v: +e.value.toFixed(4), t: Math.round(e.startTime), src: (e.sources || []).map((s) => s.node ? (s.node.id || s.node.className || s.node.nodeName).toString().slice(0, 60) : "?") }); } })
      .observe({ type: "layout-shift", buffered: true });`,
});

const PROBE = `(() => {
  const de = document.documentElement, cw = de.clientWidth;
  const sel = (el) => el.tagName.toLowerCase() + (el.id ? "#" + el.id : "") + (typeof el.className === "string" && el.className ? "." + el.className.trim().split(/\\s+/).slice(0, 3).join(".") : "");
  const clipped = (el) => { for (let p = el.parentElement; p; p = p.parentElement) { const s = getComputedStyle(p); if (/(hidden|clip|auto|scroll)/.test(s.overflowX)) { const r = p.getBoundingClientRect(); if (r.right <= cw + 1 && r.left >= -1) return true; } } return false; };
  const out = [];
  for (const el of document.body.querySelectorAll("*")) {
    const r = el.getBoundingClientRect();
    if (r.width && (r.right > cw + 1 || r.left < -1) && !clipped(el) && getComputedStyle(el).position !== "fixed") out.push(sel(el) + " [" + Math.round(r.left) + "," + Math.round(r.right) + "]");
  }
  return { scrollWidth: de.scrollWidth, clientWidth: cw, offenders: out.slice(0, 8) };
})()`;

// widest page during every tab switch (the panel slides in sideways), sampled each frame
const TAB_SWITCH = `(async () => {
  let max = 0;
  for (const id of ["tab-policy", "tab-council", "tab-advisor", "tab-news"]) {
    document.getElementById(id)?.click();
    const end = performance.now() + 800;
    while (performance.now() < end) { max = Math.max(max, document.documentElement.scrollWidth); await new Promise((r) => requestAnimationFrame(r)); }
  }
  return { maxScrollWidth: max, clientWidth: document.documentElement.clientWidth };
})()`;

const CARDS = `(async () => {
  const h = document.getElementById("ann-h");
  if (!h) return null;
  h.scrollIntoView({ block: "center" });
  await new Promise((r) => setTimeout(r, 1500));
  const items = [...h.closest("section").querySelectorAll("ul > li")];
  const rows = {};
  for (const li of items) {
    const r = li.getBoundingClientRect(), inner = li.firstElementChild, card = li.querySelector("article");
    const key = Math.round(r.top);
    (rows[key] ??= []).push({ top: Math.round(card.getBoundingClientRect().top), bottom: Math.round(card.getBoundingClientRect().bottom), transform: getComputedStyle(inner).transform });
  }
  return Object.values(rows);
})()`;

const STICKY = `(async () => {
  const bar = document.querySelector("#tab-panel")?.parentElement.querySelector(".sticky");
  if (!bar) return null;
  window.scrollTo(0, 0);
  await new Promise((r) => setTimeout(r, 300));
  const tops = [];
  for (let y = 0; y < 2400; y += 60) { window.scrollTo(0, y); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); tops.push(Math.round(bar.getBoundingClientRect().top * 10) / 10); }
  // from the first sample where the bar stopped moving (= stuck) on, every sample must be identical
  const first = tops.findIndex((t, i) => i < tops.length - 1 && t === tops[i + 1]);
  const settled = first < 0 ? [] : tops.slice(first);
  return { distinctWhileStuck: [...new Set(settled)], samples: tops.length };
})()`;

mkdirSync(OUT, { recursive: true });
const report = [];
let failed = false;
for (const v of VIEWPORTS) {
  await send("Emulation.setDeviceMetricsOverride", { width: v.width, height: v.height, deviceScaleFactor: 1, mobile: v.mobile });
  await send("Emulation.setTouchEmulationEnabled", { enabled: v.mobile });
  await send("Page.navigate", { url: BASE });
  await sleep(4500);
  const overflowTop = await evaluate(PROBE);
  const pills = await evaluate(`document.querySelectorAll('[role=tablist][aria-label] [role=tab] > span[aria-hidden]').length`);
  const shot = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(join(OUT, `${LABEL}-${v.name}.png`), Buffer.from(shot.data, "base64"));
  const sw = await evaluate(TAB_SWITCH);
  const sticky = await evaluate(STICKY);
  const overflowScrolled = await evaluate(PROBE);
  const cards = await evaluate(CARDS);
  const shotCards = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(join(OUT, `${LABEL}-${v.name}-cards.png`), Buffer.from(shotCards.data, "base64"));
  const cls = await evaluate(`({ cls: +window.__cls.toFixed(4), shifts: window.__shifts.slice(0, 6) })`);

  const misaligned = (cards ?? []).some((row) => new Set(row.map((c) => c.top)).size > 1 || new Set(row.map((c) => c.bottom)).size > 1 || row.some((c) => c.transform !== "none" && !/matrix\(1, 0, 0, 1, 0, 0\)/.test(c.transform)));
  const r = {
    viewport: v.name,
    overflow: overflowTop.scrollWidth > overflowTop.clientWidth || overflowScrolled.scrollWidth > overflowScrolled.clientWidth || sw.maxScrollWidth > sw.clientWidth,
    maxScrollWidthDuringTabSwitch: sw.maxScrollWidth,
    scrollWidth: overflowScrolled.scrollWidth, clientWidth: overflowScrolled.clientWidth,
    offenders: [...new Set([...overflowTop.offenders, ...overflowScrolled.offenders])].slice(0, 8),
    tabHighlights: pills,
    stickyTops: sticky?.distinctWhileStuck,
    cardsAligned: !misaligned, cards,
    cls: cls.cls, shifts: cls.shifts,
  };
  const ok = !r.overflow && r.tabHighlights === 1 && r.cardsAligned && (r.stickyTops?.length ?? 0) <= 1 && r.cls < 0.01;
  if (!ok) failed = true;
  report.push({ ok, ...r });
  console.log(`${ok ? "PASS" : "FAIL"} ${v.name}: overflow=${r.overflow} (${r.scrollWidth}/${r.clientWidth}, tab switch max ${r.maxScrollWidthDuringTabSwitch}) tabHighlights=${r.tabHighlights} sticky=${JSON.stringify(r.stickyTops)} cardsAligned=${r.cardsAligned} cls=${r.cls}`);
  if (r.offenders.length) console.log("   overflowing:", r.offenders.join(" | "));
  if (!r.cardsAligned) console.log("   cards:", JSON.stringify(cards));
  if (r.cls >= 0.01) console.log("   shifts:", JSON.stringify(r.shifts));
}
writeFileSync(join(OUT, `${LABEL}-report.json`), JSON.stringify(report, null, 2));
ws.close();
chrome.kill();
process.exit(failed ? 1 : 0);
