import "server-only";
import { randomBytes } from "node:crypto";
import * as adm from "@/lib/data/admin";
import { getDb } from "@/lib/db";

export type VoiceStatus = "received" | "reviewing" | "answered";
export type VoiceRecord = {
  code: string;
  category: string;
  message: string;
  anonymous: boolean;
  ip_hash: string; // only a hash of the IP is stored
};

// No 0/O/1/I to keep codes easy to read out loud.
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
export function newCode() {
  const b = randomBytes(8);
  return "UTD-" + Array.from(b.subarray(0, 6), (x) => ALPHABET[x % ALPHABET.length]).join("");
}

/** D1 is always bound on Cloudflare (local preview simulates it). */
export const storeConfigured = () => true;

/** Server only (after Turnstile + rate limit): the public has no direct database access at all. */
export const saveVoice = (rec: VoiceRecord) => adm.saveVoice(getDb(), rec);

/** Public lookup: only status + an APPROVED council reply, never the message or hashes. */
export const lookupVoice = (code: string) => adm.lookupVoice(getDb(), code);
