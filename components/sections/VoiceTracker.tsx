"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

const LABEL = { received: "รับเรื่องแล้ว", reviewing: "กำลังพิจารณา", answered: "ตอบแล้ว" } as const;
type Result = { status: keyof typeof LABEL; reply: string | null } | { error: string } | null;

/** Looks up a submission by reference code. Fetches a short-lived signed token first. */
export function VoiceTracker() {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<Result>(null);

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setRes(null);
    try {
      const t = await fetch("/api/token", { cache: "no-store" });
      if (!t.ok) throw new Error("token");
      const { token } = (await t.json()) as { token: string };
      const r = await fetch(`/api/voice/status?code=${encodeURIComponent(code.trim().toUpperCase())}`, { headers: { "x-utd-token": token }, cache: "no-store" });
      if (r.status === 404) setRes({ error: "ไม่พบรหัสนี้" });
      else if (r.status === 429) setRes({ error: "ค้นหาบ่อยเกินไป กรุณารอสักครู่" });
      else if (!r.ok) setRes({ error: "รหัสไม่ถูกต้อง (รูปแบบ UTD-XXXXXX)" });
      else setRes(await r.json());
    } catch {
      setRes({ error: "เกิดข้อผิดพลาด กรุณาลองใหม่" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={lookup} className="space-y-4 rounded-lg border border-line bg-page p-6 md:p-8">
      <h3 className="text-xl font-semibold">ติดตามสถานะด้วยรหัสอ้างอิง</h3>
      <div className="flex flex-wrap gap-3">
        <label htmlFor="ref-code" className="sr-only">รหัสอ้างอิง</label>
        <input id="ref-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="UTD-XXXXXX" maxLength={10} className="min-w-0 flex-1 rounded-md border-[1.5px] border-line bg-surface px-4 py-3 uppercase placeholder:text-muted" />
        <Button type="submit" disabled={busy || code.trim().length < 6}>{busy ? "กำลังค้นหา…" : "ตรวจสอบ"}</Button>
      </div>
      <div aria-live="polite">
        {res && "error" in res && <p className="text-[#b42318] dark:text-[#ff8a8a]">{res.error}</p>}
        {res && "status" in res && (
          <p>
            สถานะ: <strong>{LABEL[res.status]}</strong>
            {res.reply && <span className="mt-2 block rounded-md bg-pink-soft p-4">คำตอบจากสภา: {res.reply}</span>}
          </p>
        )}
      </div>
    </form>
  );
}
