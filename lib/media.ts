import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { AwsClient } from "aws4fetch";
import { sniffImage } from "@/lib/image-sniff";

// Photo files in R2 (bucket utd-council-media, private; binding MEDIA):
//   pending/<uploader>/<photo id>/<w>.webp   uploaded by the browser, waiting for review (w = 480, 960, 1920)
//   public/photos/<photo id>/<w>.webp        approved, served by this Worker at /media/public/photos/...
// The browser makes the three sizes (1920 + 960 watermarked) and the blur placeholder — no image work on the server.
// Upload = PUT to a URL valid 5 minutes, bound to one key, type image/webp and an exact size:
//   - production: presigned R2 S3 URL (aws4fetch) when R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY are set
//   - local preview (simulated R2 has no S3 endpoint): /api/upload with an HMAC-signed query, same limits

export const WIDTHS = [480, 960, 1920] as const;
export type Width = (typeof WIDTHS)[number];
export const MAX_BYTES = 10 * 1024 * 1024;
const UPLOAD_TTL = 300;
const PREVIEW_TTL = 600;
const BUCKET = "utd-council-media";

const bucket = () => getCloudflareContext().env.MEDIA;
const pendingKey = (uploader: string, id: string, w: Width) => `pending/${uploader}/${id}/${w}.webp`;
const publicKey = (id: string, w: Width) => `public/photos/${id}/${w}.webp`;

/** URL of an approved photo (served by app/media/[...key]). */
export const publicPhotoUrl = (id: string, w: Width) => `/media/${publicKey(id, w)}`;

function secret() {
  const s = process.env.APP_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "production") throw new Error("APP_SECRET (>=16 chars) is required");
  return "dev-only-secret-change-me";
}
const mac = (s: string) => createHmac("sha256", secret()).update(s).digest("base64url");
const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

const s3 = () => {
  const { R2_ACCOUNT_ID: acc, R2_ACCESS_KEY_ID: id, R2_SECRET_ACCESS_KEY: key } = process.env;
  return acc && id && key ? { client: new AwsClient({ accessKeyId: id, secretAccessKey: key, service: "s3", region: "auto" }), origin: `https://${acc}.r2.cloudflarestorage.com` } : null;
};
/** For the CSP connect-src (browser PUTs straight to R2 in production). */
export const r2Origin = () => (process.env.R2_ACCOUNT_ID ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : "");

/** Three upload URLs (one per size) for a new photo id, each bound to its exact byte size. */
export async function uploadTargets(uploader: string, sizes: Record<Width, number>) {
  const id = crypto.randomUUID();
  const exp = Math.floor(Date.now() / 1000) + UPLOAD_TTL;
  const S3 = s3();
  const urls = {} as Record<Width, string>;
  for (const w of WIDTHS) {
    const key = pendingKey(uploader, id, w);
    const len = sizes[w];
    if (S3) {
      const u = new URL(`${S3.origin}/${BUCKET}/${key}`);
      u.searchParams.set("X-Amz-Expires", String(UPLOAD_TTL));
      const signed = await S3.client.sign(u.toString(), { method: "PUT", headers: { "content-type": "image/webp", "content-length": String(len) }, aws: { signQuery: true } });
      urls[w] = signed.url;
    } else {
      const q = `${key}|${exp}|${len}`;
      urls[w] = `/api/upload?${new URLSearchParams({ key, exp: String(exp), len: String(len), sig: mac(`up|${q}`) })}`;
    }
  }
  return { id, urls };
}

/** /api/upload (local preview only): checks the signed query, then streams the body into R2. */
export async function receiveUpload(req: Request) {
  if (s3()) return new Response("Use the presigned R2 URL", { status: 404 });
  const p = new URL(req.url).searchParams;
  const key = p.get("key") ?? "", exp = Number(p.get("exp")), len = Number(p.get("len"));
  if (!same(p.get("sig") ?? "", mac(`up|${key}|${exp}|${len}`)) || exp < Date.now() / 1000) return new Response("Forbidden", { status: 403 });
  if (req.headers.get("content-type") !== "image/webp") return new Response("Unsupported type", { status: 415 });
  if (!(len > 0 && len <= MAX_BYTES) || Number(req.headers.get("content-length")) !== len) return new Response("Bad size", { status: 413 });
  const body = new Uint8Array(await req.arrayBuffer());
  if (body.byteLength !== len) return new Response("Bad size", { status: 413 });
  await bucket().put(key, body, { httpMetadata: { contentType: "image/webp" } });
  return new Response(null, { status: 200 });
}

/** Width/height from a WebP header (VP8, VP8L, VP8X). null = not a WebP we understand. */
export function webpSize(b: Uint8Array): { w: number; h: number } | null {
  if (sniffImage(b) !== "webp" || b.length < 30) return null;
  const fourcc = String.fromCharCode(...b.subarray(12, 16));
  if (fourcc === "VP8X") return { w: 1 + (b[24] | (b[25] << 8) | (b[26] << 16)), h: 1 + (b[27] | (b[28] << 8) | (b[29] << 16)) };
  if (fourcc === "VP8 ") return { w: (b[26] | (b[27] << 8)) & 0x3fff, h: (b[28] | (b[29] << 8)) & 0x3fff };
  if (fourcc === "VP8L") {
    const bits = b[21] | (b[22] << 8) | (b[23] << 16) | (b[24] << 24);
    return { w: (bits & 0x3fff) + 1, h: ((bits >> 14) & 0x3fff) + 1 };
  }
  return null;
}

/**
 * Checks the three uploaded files: present, <= 10 MB, really WebP (magic bytes + header), and the largest one matches
 * the declared size. Anything wrong -> all three are deleted. Returns the real size of the 1920 file.
 */
export async function checkUpload(uploader: string, id: string, declared: { w: number; h: number }): Promise<"missing" | "bad" | { w: number; h: number }> {
  const b = bucket();
  const keys = WIDTHS.map((w) => pendingKey(uploader, id, w));
  const heads = await Promise.all(keys.map((k) => b.get(k, { range: { offset: 0, length: 32 } })));
  if (heads.some((h) => !h)) return "missing";
  const sizes = await Promise.all(heads.map(async (h) => ({ size: h!.size, dim: webpSize(new Uint8Array(await h!.arrayBuffer())) })));
  const big = sizes[2].dim;
  const ok = sizes.every((s) => s.size <= MAX_BYTES && s.dim && s.dim.w <= 1920 && s.dim.h <= 1920 * 4)
    && !!big && Math.abs(big.w - declared.w) <= 2 && Math.abs(big.h - declared.h) <= 2;
  if (!ok) {
    await b.delete(keys);
    return "bad";
  }
  return big!;
}

/** Approval: move the files pending/ -> public/. Idempotent (already public = nothing to do). */
export async function publishFiles(photos: { id: string; uploaded_by: string | null; static_path: string | null }[]) {
  const b = bucket();
  await Promise.all(photos.filter((p) => !p.static_path && p.uploaded_by).flatMap((p) => WIDTHS.map(async (w) => {
    const src = pendingKey(p.uploaded_by!, p.id, w);
    const obj = await b.get(src);
    if (!obj) return; // already moved
    await b.put(publicKey(p.id, w), obj.body, { httpMetadata: { contentType: "image/webp", cacheControl: "public, max-age=31536000, immutable" } });
    await b.delete(src);
  })));
}

/** Deletes every file of a photo (both places). */
export async function removeFiles(id: string, uploader: string | null) {
  await bucket().delete([...WIDTHS.map((w) => publicKey(id, w)), ...(uploader ? WIDTHS.map((w) => pendingKey(uploader, id, w)) : [])]);
}

/** Back-office preview of an unapproved photo: URL valid 10 minutes (only issued for rows the caller may open). */
export function previewUrl(uploader: string, id: string, w: Width = 480) {
  const exp = Math.floor(Date.now() / 1000) + PREVIEW_TTL;
  const key = pendingKey(uploader, id, w);
  return `/media/${key}?exp=${exp}&sig=${mac(`get|${key}|${exp}`)}`;
}

/** app/media/[...key]: public files for everyone, pending files only with a valid preview signature. */
export async function serveMedia(key: string, params: URLSearchParams) {
  const isPublic = /^public\/photos\/[0-9a-f-]{36}\/(480|960|1920)\.webp$/.test(key);
  const isPending = /^pending\/[A-Za-z0-9_-]+\/[0-9a-f-]{36}\/(480|960|1920)\.webp$/.test(key);
  if (!isPublic && !isPending) return new Response("Not found", { status: 404 });
  if (isPending) {
    const exp = Number(params.get("exp"));
    if (!(exp > Date.now() / 1000) || !same(params.get("sig") ?? "", mac(`get|${key}|${exp}`))) return new Response("Forbidden", { status: 403 });
  }
  const obj = await bucket().get(key);
  if (!obj) return new Response("Not found", { status: 404 });
  return new Response(obj.body, {
    headers: {
      "content-type": "image/webp",
      "x-content-type-options": "nosniff",
      "cache-control": isPublic ? "public, max-age=31536000, immutable" : "private, no-store",
      etag: obj.httpEtag,
    },
  });
}
