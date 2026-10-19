-- Council portraits are stored as AVIF + WebP (written by the server only). Uploads from the back office are still
-- WebP only: finalizeUpload checks the magic bytes (lib/admin/photos.ts checkIncoming) whatever the bucket allows.
update storage.buckets set allowed_mime_types = array['image/webp', 'image/avif'] where id in ('pending', 'public');
