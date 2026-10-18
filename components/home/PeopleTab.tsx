"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { Advisor, Contact, Img, Member } from "@/lib/content";
import { EmptyState } from "@/components/home/EmptyState";
import { CardItem, ZoneTitle } from "@/components/home/parts";
import { Modal } from "@/components/ui/Modal";
import { SmartImage } from "@/components/ui/SmartImage";
import { IconCrown, IconInstagram, IconMedal, IconStar, IconTeacher, IconUser, IconUsers } from "@/components/ui/icons";
import { rankOf } from "@/lib/search";
import { cn } from "@/lib/utils";

type Person = {
  id: string; name: string; photo: Img | null; line: string; chip: string; badge: Badge | null; gold: boolean;
  rows: [string, string][]; contact: Contact;
};
type Badge = { label: string; tone: "gold" | "silver" | "navy"; icon: "crown" | "medal" | "star" };

const fromMember = (m: Member): Person => {
  const r = rankOf(m.role);
  return {
    id: m.id, name: m.name, photo: m.photo, line: m.role, chip: m.party ? `พรรค ${m.party}` : "", gold: r === "president",
    badge: r === "president" ? { label: "ประธาน", tone: "gold", icon: "crown" } : r === "vice" ? { label: "รองประธาน", tone: "silver", icon: "medal" } : null,
    rows: [
      ["ชื่อเล่น", m.nickname],
      ["ตำแหน่ง (วาระครั้งที่)", [m.role, m.termNo].filter(Boolean).join(" · ")],
      ["ตำแหน่ง (ผู้บริหาร)", m.execTitle],
      ["สังกัดฝ่าย", m.dept],
      ["พรรคต้นสังกัด", m.party],
    ],
    contact: { instagram: m.instagram, contact: m.contact },
  };
};
const fromAdvisor = (a: Advisor, year: number): Person => ({
  id: a.id, name: a.name, photo: a.photo, line: a.subject || a.position, chip: a.nickname ? `ครู${a.nickname}` : "", gold: false,
  badge: { label: a.role || "ครูที่ปรึกษา", tone: a.role.includes("หัวหน้า") ? "gold" : "navy", icon: "star" },
  rows: [
    ["ชื่อเล่น", a.nickname ? `ครู${a.nickname}` : ""],
    ["บทบาท", a.role],
    ["กลุ่มสาระการเรียนรู้", a.subject],
    ["ตำแหน่ง", a.position],
    ["ประจำปีการศึกษา", String(year)],
  ],
  contact: { instagram: a.instagram, contact: a.contact },
});

export function PeopleTab({ kind, members, advisors, year, query, onClear }: {
  kind: "council" | "advisor"; members: Member[]; advisors: Advisor[]; year: number; query: string; onClear: () => void;
}) {
  const people = kind === "council" ? members.map(fromMember) : advisors.map((a) => fromAdvisor(a, year));
  const [open, setOpen] = useState<Person | null>(null);
  const title = kind === "council" ? "คณะกรรมการสภานักเรียน" : "คณะครูที่ปรึกษาสภานักเรียน";

  return (
    <section aria-labelledby={`${kind}-h`}>
      <ZoneTitle icon={kind === "council" ? <IconUsers width={18} height={18} /> : <IconTeacher width={18} height={18} />} count={people.length}>
        <span id={`${kind}-h`}>{title}</span>
      </ZoneTitle>
      <ul className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {people.length === 0 ? (
            <EmptyState key="empty" query={query} onClear={onClear} what={kind === "council" ? "ข้อมูลคณะกรรมการ" : "ข้อมูลครูที่ปรึกษา"} />
          ) : (
            people.map((p, i) => (
              <CardItem key={p.id} index={i}>
                <PersonCard p={p} onOpen={() => setOpen(p)} />
              </CardItem>
            ))
          )}
        </AnimatePresence>
      </ul>

      <AnimatePresence>
        {open && (
          <Modal key={open.id} layoutId={`person-${open.id}`} title="ข้อมูลแนะนำรายบุคคล" icon={<IconUser width={18} height={18} />} onClose={() => setOpen(null)} size="lg">
            <PersonDetail p={open} />
          </Modal>
        )}
      </AnimatePresence>
    </section>
  );
}

function BadgeChip({ b, className }: { b: Badge; className?: string }) {
  const Icon = b.icon === "crown" ? IconCrown : b.icon === "medal" ? IconMedal : IconStar;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.72rem] font-semibold shadow-md",
        b.tone === "gold" && "gold-shimmer bg-gradient-to-r from-[#b8901f] via-gold to-[#f1d77a] text-brand-deep",
        b.tone === "silver" && "bg-gradient-to-r from-white to-[#dfe5f0] text-brand ring-1 ring-black/5",
        b.tone === "navy" && "bg-brand-deep/85 text-white backdrop-blur",
        className,
      )}
    >
      <Icon width={13} height={13} /> {b.label}
    </span>
  );
}

function PersonCard({ p, onOpen }: { p: Person; onOpen: () => void }) {
  return (
    <div className="group h-full transition-transform duration-300 ease-out hover:-translate-y-1.5">
      <motion.article
        layoutId={`person-${p.id}`}
        style={{ borderRadius: 20 }}
        className={cn(
          "h-full overflow-hidden border border-line bg-surface shadow-soft transition-shadow duration-300 group-hover:shadow-lift",
          p.gold && "border-b-[3px] border-b-gold",
        )}
      >
        <button type="button" onClick={onOpen} aria-haspopup="dialog" className="flex h-full w-full flex-col text-left">
          <div className="relative">
            <SmartImage img={p.photo} alt={p.name} kind="portrait" sizes="(max-width: 768px) 50vw, 320px" className="aspect-[3/4] w-full bg-sky" imgClassName="group-hover:scale-105" />
            {p.badge && <BadgeChip b={p.badge} className="absolute left-2.5 top-2.5" />}
          </div>
          <div className="flex flex-1 flex-col items-center gap-1 px-3 pb-4 pt-3 text-center">
            <h3 className="font-display text-[0.95rem] font-semibold leading-snug text-strong sm:text-base">{p.name}</h3>
            <p className="text-[0.82rem] leading-snug text-muted">{p.line}</p>
            {p.chip && <span className="mt-auto rounded-full border border-line bg-surface-2 px-2.5 py-0.5 text-[0.72rem] font-medium text-ink">{p.chip}</span>}
          </div>
        </button>
      </motion.article>
    </div>
  );
}

function PersonDetail({ p }: { p: Person }) {
  const ig = p.contact.instagram;
  return (
    <div className="grid gap-6 p-5 sm:grid-cols-[5fr_7fr] sm:p-7">
      <div className="relative">
        <SmartImage img={p.photo} alt={p.name} kind="portrait" sizes="(max-width: 640px) 100vw, 340px" className="mx-auto aspect-[3/4] w-full max-w-[340px] rounded-2xl bg-sky shadow-soft" priority />
        {p.badge && <BadgeChip b={p.badge} className="absolute left-3 top-3" />}
      </div>
      <div className="min-w-0">
        <h3 className="text-2xl font-bold text-strong">{p.name}</h3>
        <p className="mt-0.5 text-muted">{p.line}</p>
        <hr className="my-4 border-line" />
        <dl className="grid gap-2.5 text-[0.95rem]">
          {p.rows.map(([k, v]) => (
            <div key={k} className="grid grid-cols-[minmax(8.5rem,auto)_1fr] gap-3">
              <dt className="font-medium text-muted">{k}</dt>
              <dd className="text-ink">{v || "-"}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-5 rounded-2xl border border-line bg-gradient-to-br from-sky/70 to-pink-soft/60 p-4">
          <p className="mb-2 font-display font-semibold text-strong">ช่องทางการติดต่อ</p>
          {ig || p.contact.contact ? (
            <div className="space-y-2">
              {ig && (
                <a
                  href={`https://www.instagram.com/${encodeURIComponent(ig)}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#8134af] px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-glow"
                >
                  <IconInstagram width={17} height={17} /> @{ig}
                </a>
              )}
              {p.contact.contact && <p className="whitespace-pre-line text-sm text-ink">{p.contact.contact}</p>}
            </div>
          ) : (
            <p className="text-sm text-muted">ไม่ได้เปิดเผยช่องทางการติดต่อ</p>
          )}
        </div>
      </div>
    </div>
  );
}
