import { signIn } from "@/lib/authjs";

/** Starts Google sign-in (plain link from /login). Rate-limited to 5 / 15 min per IP in proxy.ts. */
export async function GET() {
  // throws a redirect to Google; after the callback Auth.js sends the user to /dashboard (no role -> /pending-access)
  await signIn("google", { redirectTo: "/dashboard" });
}
