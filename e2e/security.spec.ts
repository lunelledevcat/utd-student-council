import { expect, test } from "@playwright/test";
import { as, img, one, sql } from "./fixtures";
import { ADMIN_ID, BASE } from "./env";

// Security checks against the OpenNext build on workerd + local D1/R2 (run by `npm run security:check`, or alone with
// `npm run test:e2e -- e2e/security.spec.ts`). Rows created here are removed at the end of each test.

const today = () => new Date().toISOString().slice(0, 10);

test("response headers (curl -I)", async ({ request }) => {
  const r = await request.get("/th");
  const h = r.headers();
  const csp = h["content-security-policy"] ?? "";
  const script = csp.split(";").find((d) => d.trim().startsWith("script-src")) ?? "";
  expect(script).toMatch(/'nonce-[A-Za-z0-9+/=]+'/);
  expect(script).not.toContain("unsafe-inline");
  expect(script).not.toContain("unsafe-eval");
  expect(csp).toContain("frame-ancestors 'none'");
  expect(csp).toContain("object-src 'none'");
  expect(h["strict-transport-security"]).toContain("preload");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(h["permissions-policy"]).toContain("camera=()");
  expect(h["cross-origin-opener-policy"]).toBe("same-origin");
  expect(h["cross-origin-resource-policy"]).toBe("same-origin");
  expect(h["x-powered-by"]).toBeUndefined();
});

test("back-office write without a session -> 401; page without a session -> sign-in", async ({ request }) => {
  const post = await request.post("/th/dashboard/announcements/new", {
    headers: { "next-action": "0".repeat(40), origin: BASE, "content-type": "text/plain;charset=UTF-8" },
    data: "[]",
    maxRedirects: 0,
  });
  expect(post.status()).toBe(401);
  const get = await request.get("/th/dashboard", { maxRedirects: 0 });
  expect(get.status()).toBe(307);
  expect(get.headers().location).toContain("/th/login");
});

test("council cannot open or change a row written by someone else", async ({ browser }) => {
  const other = { id: crypto.randomUUID() };
  await sql("INSERT INTO announcements (id, year, title, published_on, author_id, status) VALUES (?, (SELECT year FROM academic_years WHERE is_current = 1), ?, ?, ?, 'pending')", other.id, "[E2E] someone else's draft", today(), ADMIN_ID);
  try {
    const council = await as(browser, "council");
    const res = await council.goto(`/th/dashboard/announcements/${other!.id}`);
    expect(res!.status()).toBe(404); // the data layer hides it: no form, and nothing reveals that the row exists
    await expect(council.getByText("someone else's draft")).toHaveCount(0);
    await council.goto("/th/dashboard/announcements");
    await expect(council.getByText("someone else's draft")).toHaveCount(0);
  } finally {
    await sql("DELETE FROM announcements WHERE id = ?", other.id);
  }
});

test("<script> in content is shown as text, never run", async ({ page }) => {
  const payload = `<script>window.__xss=1</script><img src=x onerror="window.__xss=2">[E2E] xss`;
  const row = { id: crypto.randomUUID() };
  await sql("INSERT INTO announcements (id, year, title, published_on, author_id, status, pinned) VALUES (?, (SELECT year FROM academic_years WHERE is_current = 1), ?, ?, ?, 'approved', 1)", row.id, payload, today(), ADMIN_ID);
  try {
    let dialog = false;
    page.on("dialog", (d) => { dialog = true; void d.dismiss(); });
    await page.goto("/th");
    await expect(page.getByText("<script>window.__xss=1</script>", { exact: false }).first()).toBeVisible();
    expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined();
    expect(await page.locator('img[src="x"]').count()).toBe(0);
    expect(dialog).toBe(false);
  } finally {
    await sql("DELETE FROM announcements WHERE id = ?", row.id);
  }
});

test(".html renamed .jpg is rejected (browser check and server magic-byte check)", async ({ browser }) => {
  const council = await as(browser, "council");
  await council.goto("/th/dashboard/activities/new");
  const input = council.locator('input[type="file"]');
  const html = Buffer.from("<!doctype html><html><body><script>alert(1)</script></body></html>");

  // 1) browser: refused before anything is uploaded
  await input.setInputFiles({ name: "photo.jpg", mimeType: "image/jpeg", buffer: html });
  await expect(council.getByText("ไฟล์นี้ไม่ใช่รูปภาพที่รองรับ").first()).toBeVisible();

  // 2) server: a real photo is picked, but the bytes that reach storage are HTML of the same length (as a hand-made
  //    request within the signed size would send) -> finalize reads the magic bytes and refuses
  await council.route(/\/api\/upload\?/, (route) => {
    const len = route.request().postDataBuffer()?.length ?? 0;
    const fake = Buffer.alloc(len, 0x20);
    html.copy(fake, 0, 0, Math.min(html.length, len));
    return route.continue({ postData: fake });
  });
  const before = (await one<{ n: number }>("SELECT count(*) n FROM photos"))!.n;
  await input.setInputFiles([img(1)]);
  await expect(council.getByText("ไฟล์นี้ไม่ใช่รูปภาพที่รองรับ")).toHaveCount(2, { timeout: 30_000 });
  expect((await one<{ n: number }>("SELECT count(*) n FROM photos"))!.n).toBe(before); // no photo row was created
});

test("sign-in starts at Google with the Auth.js callback; sign out everywhere ends every session", async ({ page, request }) => {
  const start = await request.get("/auth/google", { maxRedirects: 0 });
  expect([302, 303, 307]).toContain(start.status());
  const to = new URL(start.headers().location);
  expect(to.host).toBe("accounts.google.com");
  expect(to.searchParams.get("redirect_uri")).toBe(`${BASE}/api/auth/callback/google`);
  expect(to.searchParams.get("code_challenge")).toBeTruthy(); // PKCE
  const setCookie = start.headersArray().filter((h) => h.name.toLowerCase() === "set-cookie").map((h) => h.value).join("\n");
  expect(setCookie).toMatch(/HttpOnly/i);
  expect(setCookie).toMatch(/SameSite=Lax/i);

  // a throw-away teacher with two devices
  const uid = crypto.randomUUID();
  await sql("INSERT INTO users (id, email, emailVerified, role) VALUES (?, ?, ?, 'teacher')", uid, `e2e-t-${uid.slice(0, 8)}@utd.ac.th`, Date.now());
  const exp = Date.now() + 864e5;
  await sql("INSERT INTO sessions (sessionToken, userId, expires) VALUES (?, ?, ?), (?, ?, ?)", `a-${uid}`, uid, exp, `b-${uid}`, uid, exp);
  await page.context().addCookies([{ name: "authjs.session-token", value: `a-${uid}`, url: BASE }]);
  await page.goto("/th/dashboard");
  await expect(page).toHaveURL(/\/th\/dashboard/);
  const out = await page.request.post("/auth/signout", { form: { scope: "global" }, headers: { origin: BASE }, maxRedirects: 0 });
  expect(out.status()).toBe(303);
  expect(await sql("SELECT 1 FROM sessions WHERE userId = ?", uid)).toHaveLength(0);
  await page.goto("/th/dashboard");
  await expect(page).toHaveURL(/\/th\/login/);
});
