import "server-only";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { onSignIn } from "@/lib/data/admin";
import { getDb } from "@/lib/db";
import { accounts, sessions, users, verificationTokens } from "@/lib/db/schema";
import { canSignIn } from "@/lib/env";
import { logSecurity } from "@/lib/security-log";

/**
 * Auth.js (v5) — Google only, sessions stored in D1 (`sessions` table), so a session can be revoked (sign out on
 * every device = delete the user's rows). Built per request because the D1 binding belongs to the request.
 *
 * Who may sign in (checked here on the server, and again on every request in lib/auth.ts):
 *   Google says the address is verified AND (it is on ALLOWED_EMAIL_DOMAIN OR listed in ADMIN_EMAILS).
 * A signed-in user without a role sees /pending-access.
 *
 * Cookies (Auth.js defaults): `__Secure-authjs.session-token`, HttpOnly, Secure on https, SameSite=Lax.
 * Google redirect URI: <SITE_URL>/api/auth/callback/google
 */
export const { handlers, auth, signIn, signOut } = NextAuth(() => {
  const db = getDb();
  return {
    adapter: DrizzleAdapter(db, { usersTable: users, accountsTable: accounts, sessionsTable: sessions, verificationTokensTable: verificationTokens }),
    session: { strategy: "database", maxAge: 30 * 24 * 3600, updateAge: 24 * 3600 },
    trustHost: true, // the Worker sits behind Cloudflare; the host header is set by Cloudflare
    pages: { signIn: "/login", error: "/login" },
    providers: [
      Google({
        authorization: { params: { prompt: "select_account" } }, // no `hd`: ADMIN_EMAILS may be outside the domain
        // Users copied from Supabase already exist by email; Google verifies the address (checked in signIn below),
        // so linking the Google account to that user is safe.
        allowDangerousEmailAccountLinking: true,
      }),
    ],
    callbacks: {
      signIn({ profile }) {
        const ok = canSignIn(profile?.email, profile?.email_verified === true);
        if (!ok) void logSecurity("login", { detail: { ok: false, domain: String(profile?.email ?? "").split("@")[1] ?? "" } });
        return ok;
      },
    },
    events: {
      async signIn({ user, profile }) {
        if (!user.id || !user.email) return;
        // Google confirmed the address in the signIn callback; the adapter does not store that for OAuth users
        if (profile?.email_verified === true) await db.update(users).set({ emailVerified: new Date() }).where(eq(users.id, user.id));
        await onSignIn(db, user.id, user.email);
        void logSecurity("login", { userId: user.id, detail: { ok: true } });
      },
    },
  };
});
