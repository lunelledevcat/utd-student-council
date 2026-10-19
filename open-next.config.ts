import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// No incremental cache: every page is rendered per request (per-request CSP nonce), there are no ISR pages.
export default defineCloudflareConfig({});
