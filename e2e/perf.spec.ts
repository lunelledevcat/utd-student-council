import { appendFileSync } from "node:fs";
import { as, expect, fillDate, img, test, uniq } from "./fixtures";

// Timing probe (not a pass/fail test of speed): upload 10 photos and save the form, log the numbers.
// Run: npm run test:e2e -- --no-build -g perf   -> appends to e2e/.auth/perf.log
test("perf: upload 10 photos + save", async ({ browser }) => {
  test.setTimeout(300_000);
  const page = await as(browser, "council");
  await page.goto("/th/dashboard/activities/new");
  await page.locator('[name="title"]').fill(uniq("perf"));
  await fillDate(page, "event_date", "2026-10-01");
  const files = Array.from({ length: 10 }, (_, i) => img((i % 4) + 1));

  const t0 = Date.now();
  await page.locator('input[type="file"]').setInputFiles(files);
  await expect(page.locator('input[type="hidden"][name="photos"]')).toHaveCount(10, { timeout: 240_000 });
  const upload = Date.now() - t0;

  const t1 = Date.now();
  // time until the server confirms the save (the list itself updates optimistically at once)
  await page.getByRole("button", { name: /^(ส่งอนุมัติ|บันทึกและเผยแพร่)$/ }).click();
  await expect(page.getByRole("status").filter({ hasText: "ส่งอนุมัติแล้ว" }).first()).toBeVisible({ timeout: 60_000 });
  const save = Date.now() - t1;

  const line = `${new Date().toISOString()} ${process.env.PERF_LABEL ?? "run"} upload10=${upload}ms save=${save}ms\n`;
  appendFileSync("e2e/.auth/perf.log", line);
  console.log(line.trim());
});
