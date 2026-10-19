// Access rules that Postgres RLS + triggers enforced before the move to D1. Pure functions: every data function in
// lib/data/* asks these, and lib/data/rules.test.ts covers each one. Change a rule here, nowhere else.
import type { ReviewStatus, Role } from "@/lib/db/schema";

/** Who is asking. null = anonymous visitor. role null = signed in but not granted access yet. */
export type Actor = { id: string; email: string; role: Role | null } | null;

export const STAFF: Role[] = ["teacher", "admin"];
export const MEMBERS: Role[] = ["council", "teacher", "admin"];

export const isMember = (a: Actor): a is NonNullable<Actor> & { role: Role } => !!a?.role && MEMBERS.includes(a.role);
export const isStaff = (a: Actor) => !!a?.role && STAFF.includes(a.role);
export const isAdmin = (a: Actor) => a?.role === "admin";

type Owned = { status: ReviewStatus; owner: string | null };

/** Public: approved only. Members: approved + their own rows. Staff: everything. */
export const canRead = (a: Actor, r: Owned) => r.status === "approved" || isStaff(a) || (isMember(a) && r.owner === a.id);
/** Members create rows, always as themselves and always pending. */
export const canCreate = (a: Actor) => isMember(a);
/** Staff edit anything; council edit their own rows while pending or rejected (editing sends it back to pending). */
export const canEdit = (a: Actor, r: Owned) => isStaff(a) || (isMember(a) && r.owner === a.id && (r.status === "pending" || r.status === "rejected"));
/** Staff delete anything; council delete their own pending rows. */
export const canDelete = (a: Actor, r: Owned) => isStaff(a) || (isMember(a) && r.owner === a.id && r.status === "pending");
/** Approve / reject / hide, hero slides, deleting any photo. */
export const canReview = (a: Actor) => isStaff(a);
/** Academic years, security page, role management. */
export const canAdminister = (a: Actor) => isAdmin(a);

/**
 * Columns a write may set. Review columns are never taken from the input. A council edit always goes back to
 * pending (the old trigger `lock_review_columns`); a staff edit keeps the current status.
 */
export function writable<T extends Record<string, unknown>>(a: Actor, values: T) {
  const out: Record<string, unknown> = { ...values };
  for (const k of ["id", "status", "author_id", "uploaded_by", "reviewed_by", "reviewed_at", "reason", "is_hero", "hero_order", "created_at", "year"]) delete out[k];
  if (!isStaff(a)) out.status = "pending";
  return out as Partial<T> & { status?: ReviewStatus };
}

/**
 * Photos a caller may attach to a row: their own uploads, photos already on that row, or (staff) any photo.
 * Approved photos are public, so "can see it" is not enough — that would let a member move someone else's photo
 * onto their own row (IDOR).
 */
export const canAttachPhoto = (a: Actor, p: { uploaded_by: string | null; onThisRow: boolean }) =>
  isStaff(a) || (isMember(a) && (p.uploaded_by === a.id || p.onThisRow));

/** Error with a message key under dashboard.errors (the UI translates it). */
export class DataError extends Error {
  constructor(public key: string, public values?: Record<string, number>) {
    super(key);
  }
}
