import { as, test } from "./fixtures";

// Screenshots for review (not assertions). Run: npx playwright test e2e/screens.spec.ts   (OUT=… to change folder)
const OUT = process.env.OUT ?? "../utd-shots/compare/backoffice";
test.skip(!process.env.SCREENS, "set SCREENS=1 to capture");

for (const [label, size] of [["desktop", { width: 1440, height: 1000 }], ["mobile", { width: 390, height: 844 }]] as const) {
  test(`back-office form + calendar (${label})`, async ({ browser }) => {
    const page = await as(browser, "council");
    await page.setViewportSize(size);
    await page.goto("/th/dashboard/policies/new");
    await page.locator('[name="title"]').fill("[ตัวอย่าง] โครงการห้องเรียนสะอาด");
    await page.locator('[name="summary"]').fill("สรุปสั้นๆ ของนโยบาย");
    await page.screenshot({ path: `${OUT}/${label}-form.png`, fullPage: true });
    await page.goto("/th/dashboard/announcements/new");
    await page.getByRole("button", { name: "เปิดปฏิทิน" }).click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT}/${label}-calendar.png` });
  });
}

test("back-office list (desktop, admin)", async ({ browser }) => {
  const page = await as(browser, "admin");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/th/dashboard/announcements");
  await page.screenshot({ path: `${OUT}/desktop-list.png` });
});
