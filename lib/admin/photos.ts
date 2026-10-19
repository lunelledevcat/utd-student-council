import "server-only";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { sniffImage } from "@/lib/image-sniff";
import { adminClient } from "@/lib/supabase/admin";
import { publicImageUrl } from "@/lib/supabase/public";

// Photo pipeline (fast path — the user never waits for image processing):
//  1. browser compresses to WebP <= 1920 px, asks for a one-time signed upload URL (role checked by the caller)
//     and PUTs the file straight to Supabase Storage: pending/incoming/<user>/<id>.webp (never through Next)
//  2. finalize: server checks the object exists, inserts photos(status=pending) at once and schedules makeVariants()
//     with after() — re-encode with sharp (EXIF/GPS stripped), 1920/960 (watermarked) + 480 + 16 px blur into
//     pending/photos/<id>/<w>.webp, then deletes the incoming file
//  3. on approval the variants are copied to the public bucket (publishPhotos -> ensureVariants first, in case step 2
//     has not finished yet)

export const WIDTHS = [480, 960, 1920] as const;
const MAX_BYTES = 10 * 1024 * 1024;
const MAX_PIXELS = 60_000_000;
/** Back-office previews of unapproved photos: short-lived signed URLs (10 min), only for rows the caller may open. */
const PREVIEW_TTL = 600;
const incomingPath = (userId: string, id: string) => `incoming/${userId}/${id}.webp`;

export async function signedUpload(userId: string) {
  const id = randomUUID();
  const path = incomingPath(userId, id);
  const { data, error } = await adminClient().storage.from("pending").createSignedUploadUrl(path);
  if (error || !data) throw new Error(`signed upload url: ${error?.message}`);
  return { id, url: data.signedUrl };
}

/**
 * Checks the browser's upload for (user, id): exists, <= 10 MB, really a WebP image (magic bytes) and decodable within
 * the pixel limit. A file that fails is deleted. "missing" | "bad" | "ok".
 */
export async function checkIncoming(userId: string, id: string): Promise<"missing" | "bad" | "ok"> {
  const store = adminClient().storage.from("pending");
  const { data, error } = await store.download(incomingPath(userId, id));
  if (error || !data) return "missing";
  const buf = new Uint8Array(await data.arrayBuffer());
  let ok = buf.byteLength <= MAX_BYTES && sniffImage(buf.subarray(0, 16)) === "webp";
  if (ok) {
    try {
      const m = await sharp(buf, { limitInputPixels: MAX_PIXELS }).metadata();
      ok = m.format === "webp" && !!m.width && !!m.height;
    } catch {
      ok = false;
    }
  }
  if (!ok) await store.remove([incomingPath(userId, id)]);
  return ok ? "ok" : "bad";
}

/** Small, centred-bottom-right watermark (Latin text: server fonts may lack Thai glyphs). */
function watermark(width: number) {
  const size = Math.max(14, Math.round(width / 70));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${size * 2}">
    <text x="${width - size}" y="${Math.round(size * 1.4)}" text-anchor="end" font-family="sans-serif" font-size="${size}" font-weight="600"
      fill="#ffffff" fill-opacity="0.55" stroke="#000000" stroke-opacity="0.18" stroke-width="1">© UTD Student Council</text></svg>`;
  return Buffer.from(svg);
}

/** Builds the variants + blur from the uploaded source. Safe to call twice (upsert, source may already be gone). */
export async function makeVariants(id: string, uploaderId: string) {
  const store = adminClient().storage.from("pending");
  const src = incomingPath(uploaderId, id);
  const { data: blob, error } = await store.download(src);
  if (error || !blob) throw new Error(`source missing for ${id}`);
  if (blob.size > MAX_BYTES) throw new Error(`source too large for ${id}`);
  const base = sharp(Buffer.from(await blob.arrayBuffer()), { limitInputPixels: MAX_PIXELS, failOn: "error" }).rotate();
  const meta = await base.metadata();
  if (!meta.format || !["jpeg", "png", "webp"].includes(meta.format)) throw new Error(`unsupported format for ${id}`);

  await Promise.all(WIDTHS.map(async (width) => {
    let img = base.clone().resize({ width, withoutEnlargement: true });
    if (width >= 960) {
      const { info } = await img.clone().toBuffer({ resolveWithObject: true });
      img = img.composite([{ input: watermark(info.width), gravity: "southeast" }]);
    }
    const out = await img.webp({ quality: 80 }).toBuffer();
    const { error: e } = await store.upload(`photos/${id}/${width}.webp`, out, { contentType: "image/webp", upsert: true });
    if (e) throw new Error(`variant ${width} for ${id}: ${e.message}`);
  }));
  const tiny = await base.clone().resize({ width: 16 }).webp({ quality: 40 }).toBuffer();
  await adminClient().from("photos").update({ blur: `data:image/webp;base64,${tiny.toString("base64")}` }).eq("id", id);
  await store.remove([src]);
}

/** Variants present? If not (background job still running or failed), build them now. */
export async function ensureVariants(id: string) {
  const db = adminClient();
  const { data: files } = await db.storage.from("pending").list(`photos/${id}`);
  if (WIDTHS.every((w) => files?.some((f) => f.name === `${w}.webp`))) return;
  const { data: row } = await db.from("photos").select("uploaded_by,static_path").eq("id", id).maybeSingle();
  if (!row || row.static_path || !row.uploaded_by) return;
  await makeVariants(id, row.uploaded_by);
}

/** Preview URLs for the back office: approved -> public bucket; pending -> signed 480 variant, or the uploaded source
 *  while the variants are still being built. */
export async function previewUrls(photos: { id: string; status: string; uploadedBy?: string | null }[]) {
  const out: Record<string, string> = {};
  const store = adminClient().storage.from("pending");
  for (const p of photos) if (p.status === "approved") out[p.id] = publicImageUrl(`photos/${p.id}/480.webp`);
  const pending = photos.filter((p) => p.status !== "approved");
  if (pending.length) {
    const { data } = await store.createSignedUrls(pending.map((p) => `photos/${p.id}/480.webp`), PREVIEW_TTL);
    for (const [i, d] of (data ?? []).entries()) if (d.signedUrl && !d.error) out[pending[i].id] = d.signedUrl;
    const missing = pending.filter((p) => !out[p.id] && p.uploadedBy);
    if (missing.length) {
      const { data: src } = await store.createSignedUrls(missing.map((p) => incomingPath(p.uploadedBy!, p.id)), PREVIEW_TTL);
      for (const [i, d] of (src ?? []).entries()) if (d.signedUrl && !d.error) out[missing[i].id] = d.signedUrl;
    }
  }
  return out;
}

/** Copies variants of pending photos to the public bucket and marks them approved. Idempotent. */
export async function publishPhotos(ids: string[], reviewerId: string) {
  if (!ids.length) return;
  const db = adminClient();
  const { data } = await db.from("photos").select("id,status").in("id", ids);
  const todo = (data ?? []).filter((p) => p.status !== "approved").map((p) => p.id as string);
  await Promise.all(todo.map(async (id) => {
    await ensureVariants(id);
    await Promise.all(WIDTHS.map(async (w) => {
      const path = `photos/${id}/${w}.webp`;
      const { error } = await db.storage.from("pending").copy(path, path, { destinationBucket: "public" });
      if (error && !/exists/i.test(error.message)) throw new Error(`publish ${id}: ${error.message}`);
    }));
  }));
  if (todo.length) {
    await db.from("photos").update({ status: "approved", reviewed_by: reviewerId, reviewed_at: new Date().toISOString(), reason: null }).in("id", todo);
  }
}

/** Removes every stored file of a photo (public + pending variants, and an unprocessed upload). */
export async function removePhotoFiles(id: string, uploaderId: string | null) {
  const store = adminClient().storage;
  const paths = WIDTHS.map((w) => `photos/${id}/${w}.webp`);
  await Promise.all([
    store.from("public").remove(paths),
    store.from("pending").remove([...paths, ...(uploaderId ? [incomingPath(uploaderId, id)] : [])]),
  ]);
}
