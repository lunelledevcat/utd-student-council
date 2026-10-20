"use client";

import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { Advisor, Contact, Img, L, Member } from "@/lib/content";
import { EmptyState } from "@/components/home/EmptyState";
import { CardItem, Lift, ZoneTitle } from "@/components/home/parts";
import { Tx, useL } from "@/components/i18n/LocaleProvider";
import { Modal } from "@/components/ui/Modal";
import { SmartImage } from "@/components/ui/SmartImage";
import { IconCrown, IconInstagram, IconMedal, IconStar, IconTeacher, IconUser, IconUsers } from "@/components/icons/Icon";
import { rankOf } from "@/lib/search";
import { cn } from "@/lib/utils";

type Badge = { label: React.ReactNode; tone: "gold" | "silver" | "navy"; icon: "crown" | "medal" | "star" };
type Person = {
  id: string; name: L; photo: Img | null; line: L; chip: React.ReactNode; badge: Badge | null; gold: boolean;
  rows: [string, React.ReactNode][]; contact: Contact;
  /** whole introduction poster for the popup (council members who agreed to show their photo) */
  poster: Img | null;
  tier: "president" | "vice" | null;
  /** council member without photo consent yet: the placeholder says so */
  pendingPhoto: boolean;
  /** shown in brackets after the name on the card */
  nick?: L | null;
};

/** Builds the card/popup view of a member or advisor in the current language. */
function usePeople(kind: "council" | "advisor", members: Member[], advisors: Advisor[], year: number): Person[] {
  const t = useTranslations("people");
  const pick = useL();
  const has = (v: L) => !!v.th;

  if (kind === "council") {
    return members.map((m) => {
      const r = rankOf(m.role.th);
      return {
        id: m.id, name: m.name, photo: m.photo, poster: m.poster, tier: r, pendingPhoto: !m.photo, line: m.role, gold: r === "president",
        chip: null, // party is plain text in the popup, never a badge on the card
        badge: r === "president" ? { label: t("president"), tone: "gold", icon: "crown" } : r === "vice" ? { label: t("vice"), tone: "silver", icon: "medal" } : null,
        rows: [
          [t("nickname"), has(m.nickname) && pick(m.nickname).value], // names stay Thai: no "TH" badge
          [t("roleShort"), has(m.role) && <Tx v={m.role} />],
          [t("dept"), has(m.dept) && <Tx v={m.dept} />],
          [t("party"), has(m.party) && <Tx v={m.party} />],
        ],
        nick: has(m.nickname) ? m.nickname : null,
        contact: { instagram: m.instagram, contact: m.contact },
      };
    });
  }
  return advisors.map((a) => ({
    id: a.id, name: a.name, photo: a.photo, poster: null, tier: null, pendingPhoto: false, line: has(a.subject) ? a.subject : a.position, gold: false,
    chip: has(a.nickname) ? t("teacherChip", { nickname: pick(a.nickname).value }) : null,
    badge: { label: has(a.role) ? <Tx v={a.role} badge={false} /> : t("advisorRole"), tone: a.role.th.includes("หัวหน้า") ? "gold" : "navy", icon: "star" },
    rows: [
      [t("nickname"), has(a.nickname) && t("teacherChip", { nickname: pick(a.nickname).value })],
      [t("role"), has(a.role) && <Tx v={a.role} />],
      [t("subject"), has(a.subject) && <Tx v={a.subject} />],
      [t("position"), has(a.position) && <Tx v={a.position} />],
      [t("year"), String(year)],
    ],
    contact: { instagram: a.instagram, contact: a.contact },
  }));
}

export function PeopleTab({ kind, members, advisors, year, query, onClear }: {
  kind: "council" | "advisor"; members: Member[]; advisors: Advisor[]; year: number; query: string; onClear: () => void;
}) {
  const t = useTranslations("people");
  const people = usePeople(kind, members, advisors, year);
  const [openId, setOpenId] = useState<string | null>(null);
  const open = people.find((p) => p.id === openId) ?? null;
  // council: chair -> vice chairs -> heads of division and secretary (each in their stored order)
  const groups =
    kind === "council"
      ? ([
          { key: "president", title: t("groups.chair"), items: people.filter((p) => p.tier === "president") },
          { key: "vice", title: t("groups.vice"), items: people.filter((p) => p.tier === "vice") },
          { key: "heads", title: t("groups.heads"), items: people.filter((p) => !p.tier) },
        ] as const).filter((g) => g.items.length)
      : [{ key: "all", title: null, items: people }];

  return (
    <section aria-labelledby={`${kind}-h`}>
      <ZoneTitle icon={kind === "council" ? <IconUsers width={18} height={18} /> : <IconTeacher width={18} height={18} />} count={people.length}>
        <span id={`${kind}-h`}>{t(kind === "council" ? "council" : "advisors")}</span>
      </ZoneTitle>
      {people.length === 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          <AnimatePresence mode="popLayout">
            <EmptyState key="empty" query={query} onClear={onClear} kind={kind} />
          </AnimatePresence>
        </ul>
      ) : (
        groups.map((g) => (
          <div key={g.key} className={g.title ? "mt-5 first:mt-0" : undefined}>
            {g.title && <h3 data-swap className="mb-3 font-display text-base font-semibold text-strong">{g.title}</h3>}
            <ul className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
              <AnimatePresence mode="popLayout">
                {g.items.map((p) => (
                  <CardItem key={p.id} index={people.indexOf(p)}>
                    <PersonCard p={p} onOpen={() => setOpenId(p.id)} />
                  </CardItem>
                ))}
              </AnimatePresence>
            </ul>
          </div>
        ))
      )}

      <AnimatePresence>
        {open && (
          <Modal key={open.id} layoutId={`person-${open.id}`} title={t("popupTitle")} icon={<IconUser width={18} height={18} />} onClose={() => setOpenId(null)} size="lg">
            <PersonDetail p={open} />
          </Modal>
        )}
      </AnimatePresence>
    </section>
  );
}

/** A person's name (never translated): each word kept on one line, so a surname is not split in the middle. */
function Name({ v }: { v: string }) {
  return <>{v.split(" ").map((part, i) => <span key={i} className="whitespace-nowrap">{i > 0 && " "}{part}</span>)}</>;
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
  const t = useTranslations("people");
  const pick = useL();
  return (
    <Lift>
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
            <SmartImage img={p.photo} alt={pick(p.name).value} kind="portrait" label={p.pendingPhoto ? t("photoPending") : undefined} sizes="(max-width: 768px) 50vw, 320px" className="aspect-[3/4] w-full bg-sky" imgClassName="group-hover:scale-105" />
            {p.badge && <BadgeChip b={p.badge} className="absolute left-2.5 top-2.5" />}
          </div>
          <div className="flex flex-1 flex-col items-center gap-1 px-3 pb-4 pt-3 text-center">
            <h3 className="font-display text-[0.95rem] font-semibold leading-snug text-strong sm:text-base"><Name v={pick(p.name).value} />{p.nick && <span className="whitespace-nowrap font-normal text-muted"> ({pick(p.nick).value})</span>}</h3>
            <p className="text-[0.82rem] leading-snug text-muted"><Tx v={p.line} /></p>
            {p.chip && <span className="mt-auto rounded-full border border-line bg-surface-2 px-2.5 py-0.5 text-[0.72rem] font-medium text-ink">{p.chip}</span>}
          </div>
        </button>
      </motion.article>
    </Lift>
  );
}

function PersonDetail({ p }: { p: Person }) {
  const t = useTranslations("people");
  const pick = useL();
  const ig = p.contact.instagram;
  return (
    <div className="grid gap-6 p-5 sm:grid-cols-[5fr_7fr] sm:p-7">
      <div className="relative">
        <SmartImage
          img={p.poster ?? p.photo}
          alt={p.poster ? t("poster", { name: pick(p.name).value }) : pick(p.name).value}
          kind="portrait"
          sizes="(max-width: 640px) 100vw, 340px"
          className={cn("mx-auto w-full max-w-[340px] rounded-2xl bg-sky shadow-soft", p.poster ? "aspect-[4/5]" : "aspect-[3/4]")}
          priority
        />
        {/* the poster is shown as made: nothing drawn over it */}
        {p.badge && !p.poster && <BadgeChip b={p.badge} className="absolute left-3 top-3" />}
      </div>
      <div data-swap className="min-w-0">
        <h3 className="text-2xl font-bold text-strong"><Name v={pick(p.name).value} /></h3>
        <p className="mt-0.5 text-muted"><Tx v={p.line} /></p>
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
          <p className="mb-2 font-display font-semibold text-strong">{t("contact")}</p>
          {ig || p.contact.contact ? (
            <div className="space-y-2">
              {ig && (
                <a
                  href={`https://www.instagram.com/${ig}/`}
                  aria-label={t("openInstagram", { name: pick(p.name).value })}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#8134af] px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-glow"
                >
                  <IconInstagram width={17} height={17} /> @{ig}
                </a>
              )}
              {p.contact.contact && <p className="whitespace-pre-line text-sm text-ink">{p.contact.contact}</p>}
            </div>
          ) : (
            <p className="text-sm text-muted">{t("noContact")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
