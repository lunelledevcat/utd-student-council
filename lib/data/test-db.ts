// Test helper: a fresh in-memory D1 (wrangler getPlatformProxy, persist: false) with drizzle/*.sql applied.
import { readFileSync, readdirSync } from "node:fs";
import { drizzle } from "drizzle-orm/d1";
import { getPlatformProxy } from "wrangler";
import * as schema from "@/lib/db/schema";
import type { Db } from "@/lib/db/types";

export async function testDb() {
  const proxy = await getPlatformProxy<CloudflareEnv>({ persist: false });
  const d1 = proxy.env.DB;
  for (const f of readdirSync("drizzle").filter((n) => n.endsWith(".sql")).sort()) {
    for (const stmt of readFileSync(`drizzle/${f}`, "utf8").split("--> statement-breakpoint")) {
      if (stmt.trim()) await d1.prepare(stmt).run();
    }
  }
  return { db: drizzle(d1, { schema }) as unknown as Db, dispose: () => proxy.dispose() };
}
