// Back-office content types. One config drives the list page, the form and server-side validation
// (app/[locale]/dashboard/actions.ts), so a field exists in exactly one place. Labels/hints are message keys:
// dashboard.entities.<entity>, dashboard.fields.<entity>.<field>, dashboard.hints.<entity>.<field> (optional).
// Shared by server and client: no secrets here.

type Base = { name: string; hint?: true };
export type Field =
  /** `en`: also has an optional English column <name>_en, filled on the form's English tab */
  | (Base & { kind: "text"; required?: boolean; max: number; en?: true; pattern?: { re: string; error: "badInstagram" | "badSlug" } })
  | (Base & { kind: "textarea"; required?: boolean; max: number; rows?: number; en?: true })
  | (Base & { kind: "date"; required?: boolean })
  | (Base & { kind: "url" })
  | (Base & { kind: "number"; min: number; max: number })
  | (Base & { kind: "select"; options: string[] })
  | (Base & { kind: "checkbox" })
  /** jsonb [{date, text, text_en?}]: Thai lines "YYYY-MM-DD | text" on the Thai tab, one English line per step on the English tab */
  | (Base & { kind: "timeline" })
  /** one photo, stored as <name> (a photos.id column on the row) */
  | (Base & { kind: "image"; portrait?: boolean })
  /** many photos, linked by photos.<fk> = row id, ordered by photos.sort_order */
  | (Base & { kind: "images"; fk: "activity_id" | "policy_id" });

export type EntityKey = "announcements" | "activities" | "policies" | "members" | "advisors";

export type Entity = {
  key: EntityKey;
  /** list columns: [title column, subtitle column] */
  titleCol: string;
  subCol?: string;
  order: { col: string; asc: boolean };
  fields: Field[];
};

const IG = { re: "^@?[A-Za-z0-9._]{0,30}$", error: "badInstagram" as const };

export const ENTITIES: Record<EntityKey, Entity> = {
  announcements: {
    key: "announcements",
    titleCol: "title",
    subCol: "published_on",
    order: { col: "published_on", asc: false },
    fields: [
      { name: "title", kind: "text", required: true, max: 200, en: true },
      { name: "published_on", kind: "date", required: true },
      { name: "body", kind: "textarea", max: 5000, rows: 6, en: true, hint: true },
      { name: "link_url", kind: "url", hint: true },
      { name: "pinned", kind: "checkbox" },
      { name: "cover_photo_id", kind: "image" },
    ],
  },
  activities: {
    key: "activities",
    titleCol: "title",
    subCol: "event_date",
    order: { col: "event_date", asc: false },
    fields: [
      { name: "title", kind: "text", required: true, max: 200, en: true },
      { name: "event_date", kind: "date", required: true },
      { name: "body", kind: "textarea", max: 10000, rows: 10, en: true, hint: true },
      { name: "photos", kind: "images", fk: "activity_id" },
    ],
  },
  policies: {
    key: "policies",
    titleCol: "title",
    subCol: "progress_status",
    order: { col: "sort_order", asc: true },
    fields: [
      { name: "title", kind: "text", required: true, max: 200, en: true },
      { name: "slug", kind: "text", required: true, max: 80, hint: true, pattern: { re: "^[a-z0-9-]{2,80}$", error: "badSlug" } },
      { name: "summary", kind: "textarea", max: 500, rows: 2, en: true },
      { name: "body", kind: "textarea", max: 20000, rows: 10, en: true },
      { name: "progress_status", kind: "select", options: ["planned", "in-progress", "done"] },
      { name: "progress", kind: "number", min: 0, max: 100 },
      { name: "owner", kind: "text", max: 200, en: true },
      { name: "timeline", kind: "timeline", hint: true },
      { name: "sort_order", kind: "number", min: 0, max: 999, hint: true },
      { name: "cover_photo_id", kind: "image" },
      { name: "photos", kind: "images", fk: "policy_id" },
    ],
  },
  members: {
    key: "members",
    titleCol: "name",
    subCol: "role_title",
    order: { col: "sort_order", asc: true },
    fields: [
      { name: "photo_id", kind: "image", portrait: true },
      { name: "name", kind: "text", required: true, max: 120, en: true },
      { name: "nickname", kind: "text", max: 40, en: true },
      { name: "role_title", kind: "text", required: true, max: 120, en: true, hint: true },
      { name: "term_no", kind: "text", max: 40 },
      { name: "exec_title", kind: "text", max: 120, en: true },
      { name: "dept", kind: "text", required: true, max: 80, en: true },
      { name: "party", kind: "text", max: 80, en: true },
      { name: "sort_order", kind: "number", min: 0, max: 999, hint: true },
      { name: "instagram", kind: "text", max: 31, pattern: IG, hint: true },
      { name: "contact", kind: "textarea", max: 300, rows: 2 },
      { name: "consent_public", kind: "checkbox", hint: true },
    ],
  },
  advisors: {
    key: "advisors",
    titleCol: "name",
    subCol: "subject_group",
    order: { col: "sort_order", asc: true },
    fields: [
      { name: "photo_id", kind: "image", portrait: true },
      { name: "name", kind: "text", required: true, max: 120, en: true },
      { name: "nickname", kind: "text", max: 40, en: true },
      { name: "role_label", kind: "text", required: true, max: 60, en: true, hint: true },
      { name: "subject_group", kind: "text", max: 120, en: true },
      { name: "position", kind: "text", max: 120, en: true },
      { name: "sort_order", kind: "number", min: 0, max: 999 },
      { name: "instagram", kind: "text", max: 31, pattern: IG, hint: true },
      { name: "contact", kind: "textarea", max: 300, rows: 2 },
      { name: "consent_public", kind: "checkbox", hint: true },
    ],
  },
};

export const ENTITY_KEYS = Object.keys(ENTITIES) as EntityKey[];
export const isEntity = (v: unknown): v is EntityKey => typeof v === "string" && v in ENTITIES;

export type ReviewStatus = "pending" | "approved" | "rejected" | "hidden";
export const REVIEW_STATUSES: ReviewStatus[] = ["pending", "approved", "rejected", "hidden"];

/** Columns stored on the row itself (images = photos rows, not a column), including <name>_en columns. */
export const rowColumns = (e: Entity) =>
  e.fields.filter((f) => f.kind !== "images").flatMap((f) => ("en" in f && f.en ? [f.name, `${f.name}_en`] : [f.name]));
