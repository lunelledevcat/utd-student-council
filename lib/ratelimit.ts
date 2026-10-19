import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { hit } from "@/lib/data/admin";
import * as schema from "@/lib/db/schema";

// Rate limits on Cloudflare:
//  - page / api: Workers Rate Limiting binding (wrangler.jsonc "ratelimits"; per location, 60 s window, very cheap)
//  - login / form / upload: long windows the binding cannot express -> D1 counter (consistent across instances)
// Bans (honeypot paths): KV with a 1 h TTL (expires by itself).

export type Bucket = "page" | "api" | "form" | "login" | "upload";

const LONG: Record<"form" | "login" | "upload", { max: number; windowSec: number }> = {
  form: { max: 3, windowSec: 600 }, // 3 per 10 min (/voice)
  login: { max: 5, windowSec: 900 }, // 5 per 15 min (/login, Google sign-in start)
  upload: { max: 60, windowSec: 600 }, // 60 photos / 10 min per signed-in user (back office)
};
const BAN_SEC = 3600;

const env = () => getCloudflareContext().env;

export async function limit(bucket: Bucket, key: string): Promise<{ ok: boolean; retryAfter: number }> {
  try {
    if (bucket === "page" || bucket === "api") {
      const { success } = await (bucket === "page" ? env().RL_PAGE : env().RL_API).limit({ key });
      return { ok: success, retryAfter: 60 };
    }
    const r = LONG[bucket];
    return await hit(drizzle(env().DB, { schema }), `${bucket}:${key}`, r.max, r.windowSec * 1000);
  } catch (err) {
    // a limiter outage must not take the site down
    console.error("[ratelimit]", bucket, err);
    return { ok: true, retryAfter: 0 };
  }
}

export async function ban(ip: string) {
  try {
    await env().BANS.put(`ban:${ip}`, "1", { expirationTtl: BAN_SEC });
  } catch (err) {
    console.error("[ratelimit] ban", err);
  }
}

export async function isBanned(ip: string) {
  try {
    return (await env().BANS.get(`ban:${ip}`)) !== null;
  } catch {
    return false;
  }
}
