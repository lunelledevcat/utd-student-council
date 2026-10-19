import { receiveUpload } from "@/lib/media";

/** Local preview only (simulated R2 has no S3 endpoint): signed 5-minute PUT, same limits as the presigned R2 URL. */
export async function PUT(req: Request) {
  return receiveUpload(req);
}
