"use client";

import Script from "next/script";
import { motion, useReducedMotion } from "motion/react";
import { useActionState } from "react";
import { submitVoice, type VoiceState } from "@/app/actions/voice";
import { Button } from "@/components/ui/Button";
import { VOICE_CATEGORIES } from "@/lib/site";

const INITIAL: VoiceState = { ok: false };
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/** Five Kae Farang petals bloom when the message is sent. */
function Bloom() {
  const reduce = useReducedMotion();
  return (
    <svg viewBox="-50 -50 100 100" className="mx-auto h-28 w-28" aria-hidden>
      {[0, 72, 144, 216, 288].map((a, i) => (
        <motion.ellipse
          key={a}
          cx={0}
          cy={-22}
          rx={11}
          ry={20}
          fill="var(--c-pink)"
          opacity={0.9}
          style={{ transformOrigin: "0px 0px", rotate: a }}
          initial={reduce ? false : { scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.9 }}
          transition={{ type: "spring", stiffness: 160, damping: 14, delay: i * 0.1 }}
        />
      ))}
      <circle r={7} fill="var(--c-gold)" />
    </svg>
  );
}

export function VoiceForm() {
  const [state, action, pending] = useActionState(submitVoice, INITIAL);

  if (state.ok) {
    return (
      <div className="space-y-4 rounded-lg border border-line bg-page p-10 text-center" role="status">
        <Bloom />
        <h3 className="text-2xl font-semibold">ส่งความคิดเห็นเรียบร้อย</h3>
        <p className="text-muted">เก็บรหัสนี้ไว้ติดตามสถานะ</p>
        <p className="font-display text-3xl font-semibold tracking-wider text-pink" aria-label={`รหัสอ้างอิง ${state.code}`}>{state.code}</p>
      </div>
    );
  }

  const input = "w-full rounded-md border-[1.5px] border-line bg-surface px-4 py-3 text-ink placeholder:text-muted focus:border-pink";
  return (
    <form action={action} className="space-y-5 rounded-lg border border-line bg-page p-6 shadow-soft md:p-10" noValidate>
      {SITE_KEY && <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />}
      <div>
        <h2 className="text-3xl font-semibold">ส่งเสียงถึงสภา</h2>
        <p className="mt-1 text-muted">เล่าปัญหาหรือไอเดียของคุณ สภาอ่านทุกเรื่อง</p>
      </div>

      <div className="space-y-2">
        <label htmlFor="category" className="text-sm font-medium">หมวดหมู่</label>
        <select id="category" name="category" defaultValue="" className={input} aria-invalid={!!state.fieldErrors?.category} aria-describedby="category-err">
          <option value="" disabled>เลือกหมวด</option>
          {VOICE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <p id="category-err" className="text-sm text-[#b42318] dark:text-[#ff8a8a]">{state.fieldErrors?.category}</p>
      </div>

      <div className="space-y-2">
        <label htmlFor="message" className="text-sm font-medium">ข้อความ</label>
        <textarea id="message" name="message" rows={6} maxLength={1000} placeholder="พิมพ์ข้อความของคุณที่นี่…" className={input} aria-invalid={!!state.fieldErrors?.message} aria-describedby="message-err" />
        <p id="message-err" className="text-sm text-[#b42318] dark:text-[#ff8a8a]">{state.fieldErrors?.message}</p>
      </div>

      <label className="flex items-center gap-3">
        <input type="checkbox" name="anonymous" defaultChecked className="h-5 w-5 accent-[var(--c-pink)]" />
        <span>ไม่ระบุตัวตน</span>
      </label>

      {/* honeypot — hidden from people, bots fill it */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>เว็บไซต์ <input type="text" name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>

      {SITE_KEY && <div className="cf-turnstile" data-sitekey={SITE_KEY} data-theme="auto" />}

      {state.error && <p role="alert" className="rounded-md bg-pink-soft px-4 py-3 text-ink">{state.error}</p>}

      <Button type="submit" disabled={pending} className="w-full">{pending ? "กำลังส่ง…" : "ส่งความคิดเห็น"}</Button>
    </form>
  );
}
