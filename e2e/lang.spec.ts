import { db, expect, test } from "./fixtures";

// Language menu + switch. Screenshots go to SHOTS (default ../utd-shots/compare/lang).
const SHOTS = process.env.SHOTS ?? "../utd-shots/compare/lang";

test("globe menu: keyboard, overlay switch keeps tab + scroll + open popup", async ({ page }) => {
  // one approved member so the council tab has a card to open (removed at the end)
  const { data: y } = await db().from("academic_years").select("year").eq("is_current", true).single();
  const { data: m } = await db().from("members").insert({ year: y!.year, name: "[E2E] สมาชิกตัวอย่าง", name_en: "[E2E] Sample member", role_title: "กรรมการ", dept: "บริหาร", status: "approved" }).select("id").single();
  test.info().attach("member", { body: m!.id });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/th?tab=council");
  const button = page.getByRole("button", { name: /เปลี่ยนภาษา/ });
  await expect(button).toContainText("TH");
  await page.screenshot({ path: `${SHOTS}/1-button.png`, clip: { x: 1100, y: 0, width: 340, height: 90 } });

  // keyboard: ↓ opens, ↓ moves, ESC closes
  await button.focus();
  await page.keyboard.press("ArrowDown");
  const menu = page.getByRole("menu", { name: "เลือกภาษา" });
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("menuitemradio", { name: /ไทย/ })).toHaveAttribute("aria-checked", "true");
  await page.screenshot({ path: `${SHOTS}/2-dropdown.png`, clip: { x: 1000, y: 0, width: 440, height: 220 } });
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();

  // open a profile popup, scroll a bit, then switch from inside the popup (its header has the TH/EN choice)
  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(300);
  const scrollBefore = await page.evaluate(() => scrollY);
  await page.locator("#tab-panel ul button[aria-haspopup]").first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("ข้อมูลแนะนำรายบุคคล");
  await dialog.getByRole("radio", { name: /EN/ }).click();
  await page.waitForTimeout(180);
  await page.screenshot({ path: `${SHOTS}/3-overlay.png` });
  await expect(page.getByText("Switching to English…")).toBeVisible();
  await expect(page.getByText("Switching to English…")).toBeHidden({ timeout: 5000 });

  await expect(dialog).toContainText("Profile"); // popup still open, now in English
  await expect(page).toHaveURL(/\/en\?tab=council/);
  expect(Math.abs((await page.evaluate(() => scrollY)) - scrollBefore)).toBeLessThan(5);
  await page.screenshot({ path: `${SHOTS}/4-after-en.png` });
  await db().from("members").delete().eq("id", m!.id);
});

test("double click during a switch does not stack; mobile menu has the language row", async ({ page }) => {
  await page.goto("/th");
  const button = page.getByRole("button", { name: /เปลี่ยนภาษา/ });
  await button.click();
  await page.getByRole("menuitemradio", { name: /English/ }).click();
  await expect(page.getByRole("button", { name: /Change language/ })).toBeDisabled(); // locked while switching
  await expect(page.getByText("Switching to English…")).toBeHidden({ timeout: 5000 });
  await expect(page.getByRole("button", { name: /Change language/ })).toContainText("EN");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Open menu" }).click();
  const row = page.getByRole("radiogroup", { name: "Choose language" });
  await expect(row.getByRole("radio")).toHaveCount(2);
  await page.waitForTimeout(400); // let the menu finish fading in
  await page.screenshot({ path: `${SHOTS}/5-mobile-menu.png` });
  await row.getByRole("radio", { name: /ไทย/ }).click();
  await expect(page).toHaveURL(/\/th/);
});
