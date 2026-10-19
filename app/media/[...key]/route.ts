import { serveMedia } from "@/lib/media";

/** Photos from R2: /media/public/photos/<id>/<w>.webp (cached for a year) and signed previews of pending photos. */
export async function GET(req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  return serveMedia((await params).key.join("/"), new URL(req.url).searchParams);
}
