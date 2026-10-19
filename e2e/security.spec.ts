import { expect, test } from "@playwright/test";
import { as, db, img } from "./fixtures";
import { ADMIN, BASE } from "./env";

// Security checks against the built app + real Supabase (run by `npm run security:check`, or alone with
// `npm run test:e2e -- e2e/security.spec.ts`). Rows created here are removed at the end of each test.

const adminId = async () => (await db().from("profiles").select("id").eq("email", ADMIN).single()).data!.id as string;
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
  const { data: other } = await db().from("announcements")
    .insert({ title: "[E2E] someone else's draft", published_on: today(), author_id: await adminId(), status: "pending" })
    .select("id").single();
  try {
    const council = await as(browser, "council");
    const res = await council.goto(`/th/dashboard/announcements/${other!.id}`);
    expect(res!.status()).toBe(404); // RLS hides it: no form, and nothing reveals that the row exists
    await expect(council.getByText("someone else's draft")).toHaveCount(0);
    await council.goto("/th/dashboard/announcements");
    await expect(council.getByText("someone else's draft")).toHaveCount(0);
  } finally {
    await db().from("announcements").delete().eq("id", other!.id);
  }
});

test("<script> in content is shown as text, never run", async ({ page }) => {
  const payload = `<script>window.__xss=1</script><img src=x onerror="window.__xss=2">[E2E] xss`;
  const { data: row } = await db().from("announcements")
    .insert({ title: payload, published_on: today(), author_id: await adminId(), status: "approved", pinned: true })
    .select("id").single();
  try {
    let dialog = false;
    page.on("dialog", (d) => { dialog = true; void d.dismiss(); });
    await page.goto("/th");
    await expect(page.getByText("<script>window.__xss=1</script>", { exact: false }).first()).toBeVisible();
    expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined();
    expect(await page.locator('img[src="x"]').count()).toBe(0);
    expect(dialog).toBe(false);
  } finally {
    await db().from("announcements").delete().eq("id", row!.id);
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

  // 2) server: a real photo is picked, but the bytes that reach storage are HTML (as a hand-made request would send)
  await council.route(/\/storage\/v1\/object\/upload\/sign\//, (route) =>
    route.continue({ postData: html, headers: { ...route.request().headers(), "content-type": "image/webp" } }));
  const before = (await db().from("photos").select("id", { count: "exact", head: true })).count ?? 0;
  await input.setInputFiles([img(1)]);
  await expect(council.getByText("ไฟล์นี้ไม่ใช่รูปภาพที่รองรับ")).toHaveCount(2, { timeout: 30_000 });
  const after = (await db().from("photos").select("id", { count: "exact", head: true })).count ?? 0;
  expect(after).toBe(before); // no photo row was created
});
