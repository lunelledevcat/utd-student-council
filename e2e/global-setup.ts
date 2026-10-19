// Creates the two test users in the local D1 with a database session each (exactly the rows Auth.js writes after a
// Google sign-in) and stores the session cookie as Playwright storage state. Google itself is not contacted: the
// sign-in rules are unit-tested (lib/data/rules.test.ts) and e2e checks the redirect to Google.
// Also generates the test images (no binary fixtures in git).
import { randomBytes } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import sharp from "sharp";
import { ADMIN, ADMIN_ID, BASE, COUNCIL, COUNCIL_ID } from "./env";
import { closeLocal, sql } from "./local-db";

async function makeImages() {
  mkdirSync("e2e/.auth/img", { recursive: true });
  const colors = ["#1D3B8B", "#E8508B", "#D4AF37", "#3a9d6a"];
  for (const [i, c] of colors.entries()) {
    const label = Buffer.from(`<svg width="2400" height="1500"><text x="80" y="300" font-size="220" fill="white">E2E ${i + 1}</text></svg>`);
    await sharp({ create: { width: 2400, height: 1500, channels: 3, background: c } })
      .composite([{ input: label }])
      .jpeg({ quality: 85 })
      .toFile(`e2e/.auth/img/photo-${i + 1}.jpg`);
  }
}

export default async function globalSetup() {
  await makeImages();
  const now = new Date().toISOString();
  // a fresh database: one current academic year (the admin adds years in /dashboard/years)
  await sql("INSERT OR IGNORE INTO academic_years (year, is_current) VALUES (2569, 1)");
  for (const [id, email, role, file] of [[ADMIN_ID, ADMIN, null, "admin"], [COUNCIL_ID, COUNCIL, "council", "council"]] as const) {
    await sql("INSERT OR REPLACE INTO users (id, email, emailVerified, role, created_at) VALUES (?, ?, ?, ?, ?)", id, email, Date.now(), role, now);
    const token = randomBytes(32).toString("hex");
    await sql("INSERT INTO sessions (sessionToken, userId, expires) VALUES (?, ?, ?)", token, id, Date.now() + 864e5);
    const { hostname } = new URL(BASE);
    writeFileSync(`e2e/.auth/${file}.json`, JSON.stringify({
      cookies: [{ name: "authjs.session-token", value: token, domain: hostname, path: "/", expires: Math.floor(Date.now() / 1000) + 86400, httpOnly: true, secure: false, sameSite: "Lax" }],
      origins: [],
    }));
  }
  await closeLocal();
}
