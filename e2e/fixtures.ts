import { test as base, expect, type Browser, type Page } from "@playwright/test";
export { one, r2keys, sql } from "./local-db";

/** A page signed in as the given test account (fresh context per call). */
export async function as(browser: Browser, who: "admin" | "council"): Promise<Page> {
  const ctx = await browser.newContext({ storageState: `e2e/.auth/${who}.json` });
  return ctx.newPage();
}
export const uniq = (label: string) => `[E2E] ${label} ${Date.now().toString(36)}`;
export const img = (n: number) => `e2e/.auth/img/photo-${n}.jpg`;

/** a row in a back-office list */
export const row = (page: Page, text: string) => page.locator("tbody tr", { hasText: text });

export async function approve(page: Page, entity: string, text: string) {
  await page.goto(`/th/dashboard/${entity}`);
  const r = row(page, text);
  await r.getByRole("button", { name: "อนุมัติ", exact: true }).click();
  // approving also copies the row's photos to the public bucket, which can take a few seconds
  await expect(r).toContainText("เผยแพร่แล้ว", { timeout: 30_000 });
}

/** main button: council "ส่งอนุมัติ" (staff "บันทึกและเผยแพร่"); waits for the confirming toast */
export async function submitForm(page: Page) {
  await page.getByRole("button", { name: /^(ส่งอนุมัติ|บันทึกและเผยแพร่)$/ }).click();
  await expect(page.getByRole("status").filter({ hasText: /ส่งอนุมัติแล้ว|บันทึกและเผยแพร่แล้ว|บันทึกแล้ว/ }).first()).toBeVisible({ timeout: 30_000 });
}
/** "บันทึก" — saves and stays on the form */
export async function saveStay(page: Page) {
  await page.getByRole("button", { name: "บันทึก", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "บันทึกแล้ว" }).first()).toBeVisible({ timeout: 30_000 });
}
/** date fields: type into the visible text box (Thai, BE or ISO accepted) */
export async function fillDate(page: Page, name: string, text: string) {
  await page.locator(`input#${name}`).fill(text);
  await page.locator(`input#${name}`).press("Tab");
}

/** accept the next confirm() dialog on this page */
export const acceptNextDialog = (page: Page) => page.once("dialog", (d) => d.accept());

export { base as test, expect };
