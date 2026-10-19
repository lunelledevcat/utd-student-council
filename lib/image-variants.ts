// Browser only: turns a picked photo into the three WebP sizes the site serves (1920 and 960 carry the watermark),
// plus a tiny blurred placeholder (data URL). Replaces the server-side sharp step (Workers have no native image code).
// Re-encoding through a canvas also drops EXIF (GPS, camera data).
import imageCompression from "browser-image-compression";

export type Variants = { files: Record<480 | 960 | 1920, Blob>; width: number; height: number; blur: string };
const MARK = "© UTD Student Council";

async function encode(src: ImageBitmap, maxW: number, mark: boolean, quality: number) {
  const scale = Math.min(1, maxW / src.width);
  const w = Math.round(src.width * scale), h = Math.round(src.height * scale);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  g.imageSmoothingQuality = "high";
  g.drawImage(src, 0, 0, w, h);
  if (mark) {
    // small, bottom-right, semi-transparent (Latin text: every font has it)
    const size = Math.max(14, Math.round(w / 70));
    g.font = `600 ${size}px sans-serif`;
    g.textAlign = "right";
    g.textBaseline = "alphabetic";
    g.lineWidth = 1;
    g.strokeStyle = "rgba(0,0,0,0.18)";
    g.fillStyle = "rgba(255,255,255,0.55)";
    g.strokeText(MARK, w - size, h - size * 0.6);
    g.fillText(MARK, w - size, h - size * 0.6);
  }
  const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/webp", quality));
  if (!blob || blob.type !== "image/webp") throw new Error("webp");
  return { blob, w, h, canvas: c };
}

export async function makeVariants(file: File, signal: AbortSignal): Promise<Variants> {
  // 1) fast resize to <= 1920 (handles orientation + huge camera files), then decode once
  const base = await imageCompression(file, { maxWidthOrHeight: 1920, fileType: "image/webp", initialQuality: 0.9, useWebWorker: false, signal });
  const bmp = await createImageBitmap(base);
  try {
    const big = await encode(bmp, 1920, true, 0.85);
    const mid = await encode(bmp, 960, true, 0.82);
    const small = await encode(bmp, 480, false, 0.8);
    const tiny = await encode(bmp, 16, false, 0.5);
    const blur = await new Promise<string>((r) => { const fr = new FileReader(); fr.onload = () => r(String(fr.result)); fr.readAsDataURL(tiny.blob); });
    return { files: { 480: small.blob, 960: mid.blob, 1920: big.blob }, width: big.w, height: big.h, blur };
  } finally {
    bmp.close();
  }
}
