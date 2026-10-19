// What each environment variable is for, how to tell a real value from a test/placeholder one, and where to get it.
// Used by /admin/setup (status only — values are never sent to the browser) and by the dev-server warning
// (instrumentation.ts). Human-readable help lives in messages/<locale>.json under setup.vars.<NAME>.

export type EnvStatus = "set" | "test" | "missing";
export type EnvVar = {
  name: string;
  /** production behaviour when missing: "required" = feature broken / fails closed, "optional" = degraded but works */
  need: "required" | "optional";
  /** not secret: set in wrangler.jsonc "vars" (otherwise: wrangler secret put / .dev.vars) */
  public: boolean;
  /** where to get it */
  url: string;
  /** used by the app when the variable is absent (then it counts as set) */
  fallback?: string;
  /** value is a known test key / placeholder / too weak */
  isTest?: (v: string) => boolean;
};

const TURNSTILE_TEST_SITE = /^[123]x0{20}AA$/; // Cloudflare's documented always-pass/fail/challenge site keys
const TURNSTILE_TEST_SECRET = /^[123]x0{31}AA$/;

// Cloudflare: public = wrangler.jsonc "vars" (committed, not secret); others = `npx wrangler secret put NAME`
// (production) and .dev.vars (local preview, gitignored).
export const ENV_VARS: EnvVar[] = [
  { name: "APP_SECRET", need: "required", public: false, url: "https://developers.cloudflare.com/workers/configuration/secrets/", isTest: (v) => v.length < 32 },
  { name: "AUTH_SECRET", need: "required", public: false, url: "https://authjs.dev/getting-started/deployment#auth_secret", isTest: (v) => v.length < 32 },
  { name: "AUTH_GOOGLE_ID", need: "required", public: false, url: "https://console.cloud.google.com/apis/credentials", isTest: (v) => !/\.apps\.googleusercontent\.com$/.test(v) },
  { name: "AUTH_GOOGLE_SECRET", need: "required", public: false, url: "https://console.cloud.google.com/apis/credentials" },
  { name: "TURNSTILE_SECRET_KEY", need: "required", public: false, url: "https://dash.cloudflare.com/?to=/:account/turnstile", isTest: (v) => TURNSTILE_TEST_SECRET.test(v) },
  { name: "R2_ACCOUNT_ID", need: "optional", public: false, url: "https://dash.cloudflare.com/?to=/:account/r2/overview" },
  { name: "R2_ACCESS_KEY_ID", need: "optional", public: false, url: "https://dash.cloudflare.com/?to=/:account/r2/api-tokens" },
  { name: "R2_SECRET_ACCESS_KEY", need: "optional", public: false, url: "https://dash.cloudflare.com/?to=/:account/r2/api-tokens" },
  { name: "NEXT_PUBLIC_SITE_URL", need: "required", public: true, url: "https://developers.cloudflare.com/workers/configuration/routing/", isTest: (v) => /localhost|127\.0\.0\.1|example\.com|<your-subdomain>/.test(v) },
  { name: "NEXT_PUBLIC_TURNSTILE_SITE_KEY", need: "required", public: true, url: "https://dash.cloudflare.com/?to=/:account/turnstile", isTest: (v) => TURNSTILE_TEST_SITE.test(v) },
  { name: "ALLOWED_EMAIL_DOMAIN", need: "optional", public: true, url: "https://admin.google.com/", fallback: "utd.ac.th" },
  { name: "ADMIN_EMAILS", need: "required", public: true, url: "https://myaccount.google.com/", isTest: (v) => /example\.com/.test(v) },
];

/** Cloudflare bindings (wrangler.jsonc): resources that must exist in the account. */
export const BINDINGS = ["DB", "MEDIA", "BANS", "RL_PAGE", "RL_API"] as const;


export function envStatus(v: EnvVar, env: Record<string, string | undefined> = process.env): EnvStatus {
  const value = env[v.name]?.trim() || v.fallback;
  if (!value) return "missing";
  return v.isTest?.(value) ? "test" : "set";
}
