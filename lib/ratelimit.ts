import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type Bucket = "page" | "api" | "form" | "login";

const RULES: Record<Bucket, { max: number; windowSec: number }> = {
  page: { max: 60, windowSec: 60 }, // 60 req/min
  api: { max: 20, windowSec: 60 }, // 20 req/min
  form: { max: 3, windowSec: 600 }, // 3 per 10 min (/voice)
  login: { max: 5, windowSec: 900 }, // 5 per 15 min (/login, OAuth start)
};

const hasUpstash = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

const upstash = hasUpstash
  ? Object.fromEntries(
      (Object.keys(RULES) as Bucket[]).map((b) => [
        b,
        new Ratelimit({
          redis: Redis.fromEnv(),
          limiter: Ratelimit.slidingWindow(RULES[b].max, `${RULES[b].windowSec} s`),
          prefix: `utd:${b}`,
        }),
      ]),
    )
  : null;

// In-memory fallback (dev / single instance). Not shared across serverless instances — use Upstash in production.
const hits = new Map<string, number[]>();
const banned = new Map<string, number>();

export async function limit(bucket: Bucket, key: string): Promise<{ ok: boolean; retryAfter: number }> {
  const rule = RULES[bucket];
  if (upstash) {
    const r = await (upstash as Record<Bucket, Ratelimit>)[bucket].limit(key);
    return { ok: r.success, retryAfter: Math.max(1, Math.ceil((r.reset - Date.now()) / 1000)) };
  }
  const now = Date.now();
  const k = `${bucket}:${key}`;
  const arr = (hits.get(k) ?? []).filter((t) => now - t < rule.windowSec * 1000);
  if (arr.length >= rule.max) {
    hits.set(k, arr);
    return { ok: false, retryAfter: Math.ceil((arr[0] + rule.windowSec * 1000 - now) / 1000) };
  }
  arr.push(now);
  hits.set(k, arr);
  if (hits.size > 5000) for (const [kk, v] of hits) if (now - v[v.length - 1] > 600_000) hits.delete(kk);
  return { ok: true, retryAfter: 0 };
}

const BAN_MS = 60 * 60 * 1000;

export async function ban(ip: string) {
  if (hasUpstash) await Redis.fromEnv().set(`utd:ban:${ip}`, 1, { ex: BAN_MS / 1000 });
  else banned.set(ip, Date.now() + BAN_MS);
}

export async function isBanned(ip: string) {
  if (hasUpstash) return (await Redis.fromEnv().get(`utd:ban:${ip}`)) !== null;
  const until = banned.get(ip);
  if (!until) return false;
  if (until < Date.now()) { banned.delete(ip); return false; }
  return true;
}
