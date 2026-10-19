import { handlers } from "@/lib/authjs";

// Auth.js endpoints: /api/auth/callback/google (the Google redirect URI), /api/auth/session, ...
export const { GET, POST } = handlers;
