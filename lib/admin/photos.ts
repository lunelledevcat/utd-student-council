import "server-only";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { adminClient } from "@/lib/supabase/admin";
import { publicImageUrl } from "@/lib/supabase/public";

// Photo pipeline. Browsers never write with their own token and never write to the public bucket:
//  1. server hands out a one-time signed upload URL for pending/raw/<user>/<uuid> (role already checked by the caller)
//  2. browser PUTs the original there
//  3. server re-encodes it (sharp: auto-rotate, EXIF/GPS stripped, 480/960/1920 webp + 16px blur) into
//     pending/photos/<id>/<w>.webp, inserts photos(status=pending), deletes the original
//  4. on approval the variants are copied to the public bucket (publishPhotos)

export const WIDTHS = [480, 960, 1920] as const;
const MAX_BYTES = 10 * 1024 * 1024;
const MAX_PIXELS = 60_000_000;

export async function signedRawUpload(userId: string) {
  const path = `raw/${userId}/${randomUUID()}`;
  const { data, error } = await adminClient().storage.from("pending").createSignedUploadUrl(path);
  if (error || !data) throw new Error("upload url failed");
  return { path, url: data.signedUrl };
}

/** Re-encodes an uploaded original. `rawPath` must be inside the caller's own raw/ folder. */
export async function processRaw(rawPath: string, userId: string) {
  if (!new RegExp(`^raw/${userId}/[0-9a-f-]{36}$`).test(rawPath)) throw new Error("bad path");
  const store = adminClient().storage.from("pending");
  const { data: blob, error } = await store.download(rawPath);
  if (error || !blob) throw new Error("raw upload not found");
  try {
    if (blob.size > MAX_BYTES) throw new Error("file over 10 MB");
    const input = Buffer.from(await blob.arrayBuffer());
    const base = sharp(input, { limitInputPixels: MAX_PIXELS, failOn: "error" }).rotate();
    const meta = await base.metadata();
    if (!meta.format || !["jpeg", "png", "webp"].includes(meta.format)) throw new Error("unsupported format");
    // metadata() reports pre-rotation size; EXIF orientations 5-8 swap width/height
    const swap = (meta.orientation ?? 1) >= 5;
    const w = (swap ? meta.height : meta.width) ?? 0;
    const h = (swap ? meta.width : meta.height) ?? 0;
    if (!w || !h) throw new Error("unreadable size");

    const id = randomUUID();
    for (const width of WIDTHS) {
      const out = await base.clone().resize({ width, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
      const { error: e } = await store.upload(`photos/${id}/${width}.webp`, out, { contentType: "image/webp", upsert: false });
      if (e) throw new Error("variant upload failed");
    }
    const tiny = await base.clone().resize({ width: 16 }).webp({ quality: 40 }).toBuffer();
    return { id, width: w, height: h, blur: `data:image/webp;base64,${tiny.toString("base64")}` };
  } finally {
    await store.remove([rawPath]);
  }
}

/** Preview URLs for the back office: approved photos from the public bucket, others signed from pending (1 h). */
export async function previewUrls(photos: { id: string; status: string }[]) {
  const out: Record<string, string> = {};
  const pending = photos.filter((p) => p.status !== "approved");
  for (const p of photos) if (p.status === "approved") out[p.id] = publicImageUrl(`photos/${p.id}/480.webp`);
  if (pending.length) {
    const { data } = await adminClient().storage.from("pending").createSignedUrls(pending.map((p) => `photos/${p.id}/480.webp`), 3600);
    for (const [i, d] of (data ?? []).entries()) if (d.signedUrl) out[pending[i].id] = d.signedUrl;
  }
  return out;
}

/** Copies variants of pending photos to the public bucket and marks them approved. Idempotent. */
export async function publishPhotos(ids: string[], reviewerId: string) {
  if (!ids.length) return;
  const db = adminClient();
  const { data } = await db.from("photos").select("id,status").in("id", ids);
  const todo = (data ?? []).filter((p) => p.status !== "approved").map((p) => p.id as string);
  for (const id of todo) {
    for (const w of WIDTHS) {
      const path = `photos/${id}/${w}.webp`;
      const { error } = await db.storage.from("pending").copy(path, path, { destinationBucket: "public" });
      if (error && !/exists/i.test(error.message)) throw new Error(`publish ${id}: ${error.message}`);
    }
  }
  if (todo.length) {
    await db.from("photos").update({ status: "approved", reviewed_by: reviewerId, reviewed_at: new Date().toISOString(), reason: null }).in("id", todo);
  }
}
