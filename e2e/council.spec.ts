import { expect, test } from "./fixtures";

// Council tab: one section per department (content/council-departments.json order), role tags from council_role,
// role / department chips that toggle, "to be announced" deputy cards.
test("council by department: sections, tags, chips toggle, placeholders", async ({ page }) => {
  await page.goto("/th?tab=council");
  const tab = page.locator("section[aria-labelledby=council-h]");
  const sections = tab.locator("section[aria-labelledby^=dept-]");
  await expect(sections.first()).toContainText("ฝ่ายบริหารสูงสุด");
  await expect(sections.nth(1)).toContainText("ฝ่ายนโยบายและแบบแผน");
  // president first in the executive section, tagged from the role
  await expect(sections.first().locator("li").first()).toContainText("ประธาน");
  await expect(sections.first().locator("li").first()).not.toContainText("รองประธาน");
  // a department without a deputy shows the placeholder
  await expect(sections.nth(1).getByText("รอประกาศ")).toBeVisible();

  const head = tab.getByRole("button", { name: "หัวหน้าฝ่าย", exact: true });
  await head.click();
  await expect(head).toHaveAttribute("aria-pressed", "true");
  await expect(tab.getByText("รอประกาศ")).toHaveCount(0);
  await expect(tab.locator("section[aria-labelledby=dept-executive]")).toHaveCount(0);
  await head.click();
  await expect(head).toHaveAttribute("aria-pressed", "false");
  await expect(tab.locator("section[aria-labelledby=dept-executive]")).toHaveCount(1);

  const dept = tab.getByRole("button", { name: "สวัสดิการ", exact: true });
  await dept.click();
  await expect(sections).toHaveCount(1);
  await expect(sections.first()).toContainText("ฝ่ายสวัสดิการ");
  await tab.getByRole("button", { name: "ล้างตัวกรอง" }).click();
  await expect(sections.first()).toContainText("ฝ่ายบริหารสูงสุด");

  // Instagram opens in a new tab, labelled
  const ig = tab.locator('a[href^="https://instagram.com/"]').first();
  if (await ig.count()) {
    await expect(ig).toHaveAttribute("target", "_blank");
    await expect(ig).toHaveAttribute("aria-label", /.+/);
  }
});
