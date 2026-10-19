import { approve, as, expect, fillDate, img, one, row, saveStay, submitForm, test, uniq } from "./fixtures";

// The speed / comfort features of the back-office form and lists.
test.describe.configure({ mode: "serial" });

test("date picker: Thai month + BE year, shortcuts, typed dates, stores ISO", async ({ browser }) => {
  const page = await as(browser, "council");
  await page.goto("/th/dashboard/announcements/new");
  await page.getByRole("button", { name: "เปิดปฏิทิน" }).click();
  const dialog = page.getByRole("dialog", { name: "เลือกวันที่" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText(String(new Date().getFullYear() + 543));
  await expect(dialog.getByText("พฤ", { exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "เมื่อวาน" }).click();
  await expect(dialog).toBeHidden();
  const y = new Date(Date.now() - 86_400_000);
  const iso = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, "0")}-${String(y.getDate()).padStart(2, "0")}`;
  await expect(page.locator('input[name="published_on"]')).toHaveValue(iso);

  await fillDate(page, "published_on", "5/1/2569");
  await expect(page.locator('input[name="published_on"]')).toHaveValue("2026-01-05");
  await expect(page.locator("input#published_on")).toHaveValue("5 ม.ค. 2569");
  await fillDate(page, "published_on", "19 ต.ค. 2569");
  await expect(page.locator('input[name="published_on"]')).toHaveValue("2026-10-19");

  await page.getByRole("button", { name: "เปิดปฏิทิน" }).click();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("draft autosave + restore after reload; Ctrl+S saves and stays", async ({ browser }) => {
  const title = uniq("ร่าง");
  const page = await as(browser, "council");
  await page.goto("/th/dashboard/announcements/new");
  await page.locator('[name="title"]').fill(title);
  await page.locator('[name="body"]').fill("ข้อความที่ยังไม่ได้บันทึก");
  await expect(page.getByText(/บันทึกร่างอัตโนมัติ/)).toBeVisible({ timeout: 8_000 });
  await page.reload();
  await page.getByRole("button", { name: "กู้คืนร่าง" }).click();
  await expect(page.locator('[name="title"]')).toHaveValue(title);
  await expect(page.locator('[name="body"]')).toHaveValue("ข้อความที่ยังไม่ได้บันทึก");

  await fillDate(page, "published_on", "2026-10-19");
  await page.locator('[name="title"]').focus();
  await page.keyboard.press("Control+s");
  await expect(page.getByRole("status").filter({ hasText: "บันทึกแล้ว" }).first()).toBeVisible({ timeout: 30_000 });
  await expect(page).toHaveURL(/\/dashboard\/announcements\/[0-9a-f-]{36}/);
  await page.reload();
  await expect(page.getByRole("button", { name: "กู้คืนร่าง" })).toHaveCount(0); // draft cleared after save
});

test("paste an image (Ctrl+V) into the gallery, save & add another, duplicate", async ({ browser }) => {
  const title = uniq("วางรูป");
  const page = await as(browser, "council");
  await page.goto("/th/dashboard/activities/new");
  await page.locator('[name="title"]').fill(title);
  await fillDate(page, "event_date", "2026-10-02");
  const bytes = (await import("node:fs")).readFileSync(img(3)).toString("base64");
  await page.evaluate(async (b64) => {
    const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const dt = new DataTransfer();
    dt.items.add(new File([bin], "pasted.jpg", { type: "image/jpeg" }));
    document.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true }));
  }, bytes);
  await expect(page.locator('input[type="hidden"][name="photos"]')).toHaveCount(1, { timeout: 60_000 });
  await page.getByRole("button", { name: "บันทึกและเพิ่มอันใหม่" }).click();
  await expect(page.getByRole("status").filter({ hasText: "บันทึกแล้ว" }).first()).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('[name="title"]')).toHaveValue(""); // fresh form

  await page.goto("/th/dashboard/activities");
  await row(page, title).getByRole("link", { name: "แก้ไข" }).click();
  await page.getByRole("link", { name: "ทำซ้ำรายการนี้" }).click();
  await expect(page.locator('[name="title"]')).toHaveValue(`${title} (สำเนา)`);
});

test("bulk approve with selection + keyboard (J, X, A); search narrows the list", async ({ browser }) => {
  const council = await as(browser, "council");
  const titles = [uniq("ชุด-1"), uniq("ชุด-2")];
  for (const t of titles) {
    await council.goto("/th/dashboard/announcements/new");
    await council.locator('[name="title"]').fill(t);
    await fillDate(council, "published_on", "2026-10-15");
    await submitForm(council);
  }
  const admin = await as(browser, "admin");
  await admin.goto(`/th/dashboard/announcements?q=${encodeURIComponent("ชุด-")}`);
  await expect(admin.locator("tbody tr[data-row]")).toHaveCount(2);
  await admin.locator("body").click({ position: { x: 5, y: 5 } });
  await admin.keyboard.press("x");
  await admin.keyboard.press("j");
  await admin.keyboard.press("x");
  await admin.keyboard.press("a");
  await expect(admin.getByRole("status").filter({ hasText: "อนุมัติแล้ว 2 รายการ" })).toBeVisible({ timeout: 30_000 });
  for (const t of titles) await expect(row(admin, t)).toContainText("เผยแพร่แล้ว");

  await admin.goto(`/th/dashboard/announcements?q=${encodeURIComponent(titles[0])}`);
  await expect(admin.locator("tbody tr[data-row]")).toHaveCount(1);
});

test("staff edits stay published; Ctrl+Enter submits", async ({ browser }) => {
  const title = uniq("แก้หลังเผยแพร่");
  const council = await as(browser, "council");
  await council.goto("/th/dashboard/announcements/new");
  await council.locator('[name="title"]').fill(title);
  await fillDate(council, "published_on", "2026-10-11");
  await council.locator('[name="title"]').focus();
  await council.keyboard.press("Control+Enter");
  await expect(council.getByRole("status").filter({ hasText: "ส่งอนุมัติแล้ว" }).first()).toBeVisible({ timeout: 30_000 });
  const admin = await as(browser, "admin");
  await approve(admin, "announcements", title);
  await row(admin, title).getByRole("link", { name: "แก้ไข" }).click();
  await admin.locator('[name="body"]').fill("แก้โดยครู");
  await saveStay(admin);
  expect(await one("SELECT status, body FROM announcements WHERE title = ?", title)).toEqual({ status: "approved", body: "แก้โดยครู" });
});
