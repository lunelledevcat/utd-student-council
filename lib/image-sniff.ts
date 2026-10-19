// Shared by the browser (reject before compressing) and the server (reject what reached storage).
/** Sniffs the first bytes: only real raster images pass (never trust the name or the Content-Type header). */
export function sniffImage(head: Uint8Array): "webp" | "jpeg" | "png" | null {
  const str = (from: number, to: number) => String.fromCharCode(...head.subarray(from, to));
  if (head.length >= 12 && str(0, 4) === "RIFF" && str(8, 12) === "WEBP") return "webp";
  if (head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return "jpeg";
  if (head.length >= 8 && head[0] === 0x89 && str(1, 4) === "PNG") return "png";
  return null;
}
