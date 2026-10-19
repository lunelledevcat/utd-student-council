// D1 (SQLite) schema, ported from supabase/migrations 0001–0006. Column names are unchanged (snake_case), so the
// back-office config (lib/admin/entities.ts) still maps form fields 1:1 to columns.
// Types: uuid -> text (crypto.randomUUID), timestamptz -> ISO text (sortable), date -> 'YYYY-MM-DD' text,
// boolean -> integer 0/1, jsonb -> JSON text. RLS + triggers are gone: every rule lives in lib/data/* (tested).
// Generate migrations with `npx drizzle-kit generate` (drizzle/), apply with `npm run db:migrate:local|remote`.
import { sql } from "drizzle-orm";
import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const id = () => text("id").primaryKey().$defaultFn(() => crypto.randomUUID());
const now = () => text().notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`);
const bool = (name: string) => integer(name, { mode: "boolean" }).notNull().default(false);
const t = (name: string) => text(name).notNull().default("");

/** pending -> approved | rejected | hidden. Only staff move a row out of pending. */
export type ReviewStatus = "pending" | "approved" | "rejected" | "hidden";
const review = {
  status: text("status").$type<ReviewStatus>().notNull().default("pending"),
  author_id: text("author_id"),
  reviewed_by: text("reviewed_by"),
  reviewed_at: text("reviewed_at"),
  reason: text("reason"),
  created_at: now(),
  updated_at: now(),
};

// ───────────────────────── Auth.js (users / accounts / sessions / verification tokens) ─────────────────────────
// users = Supabase auth.users + public.profiles merged: role + last_login_at are ours.

export type Role = "council" | "teacher" | "admin";

export const users = sqliteTable("users", {
  id: id(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
  image: text("image"),
  role: text("role").$type<Role>(),
  last_login_at: text("last_login_at"),
  created_at: now(),
});

export const accounts = sqliteTable("accounts", {
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("providerAccountId").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
}, (a) => [primaryKey({ columns: [a.provider, a.providerAccountId] })]);

export const sessions = sqliteTable("sessions", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
}, (s) => [index("sessions_user_idx").on(s.userId)]);

export const verificationTokens = sqliteTable("verificationTokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
}, (v) => [primaryKey({ columns: [v.identifier, v.token] })]);

export const role_invites = sqliteTable("role_invites", {
  email: text("email").primaryKey(),
  role: text("role").$type<"council" | "teacher">().notNull(),
  created_by: text("created_by"),
  created_at: now(),
});

// ───────────────────────── content ─────────────────────────

export const academic_years = sqliteTable("academic_years", {
  year: integer("year").primaryKey(),
  is_current: bool("is_current"),
  created_at: now(),
});

export const photos = sqliteTable("photos", {
  id: id(),
  caption: t("caption"),
  credit: text("credit"),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  blur: text("blur"),
  /** banner files shipped in public/banner: "/banner/utd-01" (null = files in R2) */
  static_path: text("static_path"),
  is_hero: bool("is_hero"),
  hero_order: integer("hero_order").notNull().default(0),
  activity_id: text("activity_id").references(() => activities.id, { onDelete: "cascade" }),
  policy_id: text("policy_id").references(() => policies.id, { onDelete: "cascade" }),
  sort_order: integer("sort_order").notNull().default(0),
  uploaded_by: text("uploaded_by"),
  status: review.status,
  reviewed_by: review.reviewed_by,
  reviewed_at: review.reviewed_at,
  reason: review.reason,
  created_at: now(),
}, (p) => [index("photos_activity_idx").on(p.activity_id), index("photos_policy_idx").on(p.policy_id), index("photos_hero_idx").on(p.is_hero, p.hero_order)]);

export const announcements = sqliteTable("announcements", {
  id: id(),
  year: integer("year").notNull().references(() => academic_years.year),
  slug: text("slug"),
  title: text("title").notNull(),
  title_en: t("title_en"),
  tag: t("tag"),
  excerpt: t("excerpt"),
  body: t("body"),
  body_en: t("body_en"),
  published_on: text("published_on").notNull(),
  link_url: text("link_url"),
  cover_photo_id: text("cover_photo_id"),
  pinned: bool("pinned"),
  ...review,
}, (r) => [index("announcements_year_idx").on(r.year, r.status)]);

export const activities = sqliteTable("activities", {
  id: id(),
  year: integer("year").notNull().references(() => academic_years.year),
  slug: text("slug"),
  title: text("title").notNull(),
  title_en: t("title_en"),
  event_date: text("event_date").notNull(),
  event_time: t("event_time"),
  place: t("place"),
  summary: t("summary"),
  body: t("body"),
  body_en: t("body_en"),
  ...review,
}, (r) => [index("activities_year_idx").on(r.year, r.status)]);

export type TimelineRow = { date: string; text: string; text_en?: string };
export const policies = sqliteTable("policies", {
  id: id(),
  year: integer("year").notNull().references(() => academic_years.year),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  title_en: t("title_en"),
  summary: t("summary"),
  summary_en: t("summary_en"),
  body: t("body"),
  body_en: t("body_en"),
  progress_status: text("progress_status").notNull().default("planned"),
  progress: integer("progress").notNull().default(0),
  owner: t("owner"),
  owner_en: t("owner_en"),
  timeline: text("timeline", { mode: "json" }).$type<TimelineRow[]>().notNull().default(sql`'[]'`),
  cover_photo_id: text("cover_photo_id"),
  sort_order: integer("sort_order").notNull().default(0),
  ...review,
}, (r) => [uniqueIndex("policies_slug_uq").on(r.slug), index("policies_year_idx").on(r.year, r.status)]);

const person = {
  id: id(),
  year: integer("year").notNull().references(() => academic_years.year),
  name: text("name").notNull(),
  name_en: t("name_en"),
  nickname: t("nickname"),
  nickname_en: t("nickname_en"),
  instagram: t("instagram"),
  contact: t("contact"),
  consent_public: bool("consent_public"),
  photo_id: text("photo_id"),
  sort_order: integer("sort_order").notNull().default(0),
};

export const members = sqliteTable("members", {
  ...person,
  role_title: text("role_title").notNull(),
  role_title_en: t("role_title_en"),
  term_no: t("term_no"),
  exec_title: t("exec_title"),
  exec_title_en: t("exec_title_en"),
  dept: text("dept").notNull(),
  dept_en: t("dept_en"),
  party: t("party"),
  party_en: t("party_en"),
  grade: t("grade"),
  ...review,
}, (r) => [index("members_year_idx").on(r.year, r.status)]);

export const advisors = sqliteTable("advisors", {
  ...person,
  role_label: text("role_label").notNull().default("ครูที่ปรึกษา"),
  role_label_en: t("role_label_en"),
  subject_group: t("subject_group"),
  subject_group_en: t("subject_group_en"),
  position: t("position"),
  position_en: t("position_en"),
  ...review,
}, (r) => [index("advisors_year_idx").on(r.year, r.status)]);

// ───────────────────────── voice ─────────────────────────

export const voice_messages = sqliteTable("voice_messages", {
  id: id(),
  ref_code: text("ref_code").notNull().unique(),
  category: text("category").notNull(),
  message: text("message").notNull(),
  anonymous: integer("anonymous", { mode: "boolean" }).notNull().default(true),
  ip_hash: text("ip_hash").notNull(),
  status: text("status").$type<"received" | "reviewing" | "answered">().notNull().default("received"),
  created_at: now(),
});

export const voice_replies = sqliteTable("voice_replies", {
  id: id(),
  voice_id: text("voice_id").notNull().references(() => voice_messages.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  status: review.status,
  author_id: review.author_id,
  reviewed_by: review.reviewed_by,
  reviewed_at: review.reviewed_at,
  reason: review.reason,
  created_at: now(),
});

// ───────────────────────── logs + limits ─────────────────────────

export const audit_logs = sqliteTable("audit_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  actor_id: text("actor_id"),
  actor_email: text("actor_email"),
  action: text("action").notNull(),
  target_table: text("target_table"),
  target_id: text("target_id"),
  detail: text("detail", { mode: "json" }).$type<Record<string, unknown>>().notNull().default(sql`'{}'`),
  created_at: now(),
}, (a) => [index("audit_created_idx").on(a.created_at)]);

export const security_events = sqliteTable("security_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  kind: text("kind").notNull(),
  ip_hash: text("ip_hash"),
  user_id: text("user_id"),
  path: text("path"),
  detail: text("detail", { mode: "json" }).$type<Record<string, unknown>>().notNull().default(sql`'{}'`),
  created_at: now(),
}, (e) => [index("security_created_idx").on(e.created_at)]);

/** Long-window rate limits (login 5/15 min, voice 3/10 min, uploads): one row per hit, pruned as it goes. */
export const rate_hits = sqliteTable("rate_hits", {
  key: text("key").notNull(),
  at: integer("at").notNull(),
}, (r) => [index("rate_hits_key_idx").on(r.key, r.at)]);

export const CONTENT_TABLES = { announcements, activities, policies, members, advisors } as const;
