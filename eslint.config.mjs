import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // local-only folders (gitignored): source files, test output
    "_import/**",
    "test-results/**",
    "playwright-report/**",
    "e2e/.auth/**",
    // Cloudflare (OpenNext / wrangler) build output
    ".open-next/**",
    ".wrangler/**",
  ]),
]);

export default eslintConfig;
