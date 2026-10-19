// Direct access to the test server's local D1 + R2 (same persistence dir as `wrangler dev --persist-to e2e/.state`),
// for setting up data and asserting stored state. Never used to perform the action under test.
import { getPlatformProxy } from "wrangler";
import { STATE } from "./env";

let proxy: Awaited<ReturnType<typeof getPlatformProxy<CloudflareEnv>>> | null = null;
async function env() {
  proxy ??= await getPlatformProxy<CloudflareEnv>({ persist: { path: `${STATE}/v3` } });
  return proxy.env;
}

/** Runs one SQL statement; returns the rows. */
export async function sql<T = Record<string, unknown>>(query: string, ...params: unknown[]): Promise<T[]> {
  const r = await (await env()).DB.prepare(query).bind(...params).all<T>();
  return r.results;
}
export const one = async <T = Record<string, unknown>>(query: string, ...params: unknown[]) => (await sql<T>(query, ...params))[0] ?? null;

/** Object keys in the R2 bucket under a prefix. */
export async function r2keys(prefix: string) {
  return (await (await env()).MEDIA.list({ prefix })).objects.map((o) => o.key);
}

export async function closeLocal() {
  await proxy?.dispose();
  proxy = null;
}
