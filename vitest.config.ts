import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Unit tests (lib/**/*.test.ts). The data-layer tests run against D1 from wrangler's getPlatformProxy (workerd SQLite).
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  test: { include: ["lib/**/*.test.ts"], testTimeout: 30_000, hookTimeout: 60_000 },
});
