import { test as base, expect, type Browser, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

/** A page signed in as the given test account (fresh context per call). */
export async function as(browser: Browser, who: "admin" | "council"): Promise<Page> {
  const ctx = await browser.newContext({ storageState: `e2e/.auth/${who}.json` });
  return ctx.newPage();
}
export const uniq = (label: string) => `[E2E] ${label} ${Date.now().toString(36)}`;
export const img = (n: number) => `e2e/.auth/img/photo-${n}.jpg`;
/** service-role client for assertions on stored state (never used to perform the action under test) */
export const db = () => createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
export const publicUrl = (path: string) => `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/public/${path}`;

/** a row in a back-office list */
export const row = (page: Page, text: string) => page.locator("tbody tr", { hasText: text });

export async function approve(page: Page, entity: string, text: string) {
  await page.goto(`/th/dashboard/${entity}`);
  const r = row(page, text);
  await r.getByRole("button", { name: "อนุมัติ", exact: true }).click();
  // approving also copies the row's photos to the public bucket, which can take a few seconds
  await expect(r).toContainText("เผยแพร่แล้ว", { timeout: 30_000 });
}

/** accept the next confirm() dialog on this page */
export const acceptNextDialog = (page: Page) => page.once("dialog", (d) => d.accept());

export { base as test, expect };
