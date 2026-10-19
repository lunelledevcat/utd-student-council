import { createHash } from "node:crypto";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { insertSecurityEvent } from "@/lib/data/admin";
import * as schema from "@/lib/db/schema";

// Security monitoring: writes to the D1 table security_events (shown in /admin/security) and to the Worker log.
// Usable from the proxy too. Never throws, and the same (kind, source) is stored at most once a minute per
// instance so a flood cannot flood the table.

export type SecurityKind =
  | "trap" | "ua_blocked" | "fake_bot" | "rate_limited" | "unauth_write"
  | "forbidden" | "upload_rejected" | "login" | "logout_all" | "error";

const recent = new Map<string, number>();

export function hashIp(ip: string) {
  return createHash("sha256").update(ip + (process.env.APP_SECRET ?? "dev")).digest("hex").slice(0, 32);
}

export async function logSecurity(kind: SecurityKind, e: { ip?: string; userId?: string; path?: string; detail?: Record<string, unknown> } = {}) {
  const ipHash = e.ip ? hashIp(e.ip) : null;
  console.warn(`[security] ${kind}${e.path ? ` path=${e.path}` : ""}${ipHash ? ` ip#=${ipHash.slice(0, 8)}` : ""}${e.detail ? ` ${JSON.stringify(e.detail).slice(0, 200)}` : ""}`);
  const k = `${kind}:${ipHash ?? e.userId ?? ""}`;
  const now = Date.now();
  if ((recent.get(k) ?? 0) > now - 60_000) return;
  recent.set(k, now);
  if (recent.size > 5000) recent.clear();
  try {
    const db = drizzle(getCloudflareContext().env.DB, { schema });
    await insertSecurityEvent(db, { kind, ip_hash: ipHash, user_id: e.userId ?? null, path: e.path?.slice(0, 300) ?? null, detail: e.detail ?? {} });
  } catch {
    // monitoring must never break the request
  }
}
