import "server-only";
import { randomBytes } from "node:crypto";
import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";

export type VoiceStatus = "received" | "reviewing" | "answered";
export type VoiceRecord = {
  code: string;
  category: string;
  message: string;
  anonymous: boolean;
  ip_hash: string;
  status: VoiceStatus;
  reply: string | null;
  public: boolean; // never auto-published; a council member must approve
  created_at: string;
};

const SB_URL = process.env.SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TABLE = "voice_messages";
const DEV_FILE = path.join(process.cwd(), ".data", "voice.jsonl");

// No 0/O/1/I to keep codes easy to read out loud.
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
export function newCode() {
  const b = randomBytes(8);
  return "UTD-" + Array.from(b.subarray(0, 6), (x) => ALPHABET[x % ALPHABET.length]).join("");
}

const sb = (p: string, init?: RequestInit) =>
  fetch(`${SB_URL}/rest/v1/${p}`, {
    ...init,
    headers: { apikey: SB_KEY!, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal", ...init?.headers },
    cache: "no-store",
  });

export function storeConfigured() {
  return !!(SB_URL && SB_KEY) || process.env.NODE_ENV !== "production";
}

export async function saveVoice(rec: VoiceRecord) {
  if (SB_URL && SB_KEY) {
    const r = await sb(TABLE, { method: "POST", body: JSON.stringify(rec) });
    if (!r.ok) throw new Error(`supabase insert failed: ${r.status}`);
    return;
  }
  if (process.env.NODE_ENV === "production") throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set");
  await mkdir(path.dirname(DEV_FILE), { recursive: true });
  await appendFile(DEV_FILE, JSON.stringify(rec) + "\n", "utf8");
}

/** Public lookup: only status + council reply, never the message or hashes. */
export async function lookupVoice(code: string): Promise<{ status: VoiceStatus; reply: string | null } | null> {
  if (SB_URL && SB_KEY) {
    const r = await sb(`${TABLE}?code=eq.${encodeURIComponent(code)}&select=status,reply&limit=1`, { headers: { Prefer: "" } });
    if (!r.ok) return null;
    const rows = (await r.json()) as Array<{ status: VoiceStatus; reply: string | null }>;
    return rows[0] ?? null;
  }
  try {
    const lines = (await readFile(DEV_FILE, "utf8")).split("\n").filter(Boolean);
    for (const l of lines) {
      const rec = JSON.parse(l) as VoiceRecord;
      if (rec.code === code) return { status: rec.status, reply: rec.reply };
    }
  } catch {}
  return null;
}
