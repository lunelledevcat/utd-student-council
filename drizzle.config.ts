import { defineConfig } from "drizzle-kit";

// Generates SQL migrations into drizzle/ from lib/db/schema.ts. Applied by wrangler (d1 migrations apply),
// which records them in the d1_migrations table.
export default defineConfig({ dialect: "sqlite", schema: "./lib/db/schema.ts", out: "./drizzle" });
