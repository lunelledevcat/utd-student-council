-- Banner photos shipped with the site (public/banner/*.webp, from the school's own website — see public/banner/SOURCES.md)
-- are registered as approved photos rows, so staff hide / reorder / delete them on /dashboard/hero like uploaded ones.
--   static_path: "/banner/utd-01" -> files /banner/utd-01-{768,1280,1920}.webp (null = variants in the storage bucket)
--   credit:      'school' -> the slide shows "ภาพ: โรงเรียนอุตรดิตถ์" / "Photo: Uttaradit School"

alter table public.photos
  add column if not exists static_path text check (static_path is null or static_path ~ '^/banner/[a-z0-9-]+$'),
  add column if not exists credit text check (credit is null or credit in ('school'));

-- static rows have no uploader
alter table public.photos alter column uploaded_by drop not null;
alter table public.photos drop constraint if exists photos_uploader_or_static;
alter table public.photos add constraint photos_uploader_or_static check (uploaded_by is not null or static_path is not null);
