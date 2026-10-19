import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "@/lib/db/schema";

/** The D1 database of the current request. Only lib/data/* should call this (it holds every access rule). */
export function getDb() {
  return drizzle(getCloudflareContext().env.DB, { schema });
}
export type { Db } from "@/lib/db/types";
