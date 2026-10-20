-- 1) members: what the poster / the council's document said where it differs from the published value.
--    Back office only (for checking): NOT added to the anon column grant (0002/0003/0009), so the public never reads them.
alter table public.members
  add column if not exists name_from_poster text,
  add column if not exists role_from_doc text;

-- 2) hero photos: focal point used when the photo is cropped to fill the banner frame (CSS object-position, e.g. "50% 35%")
alter table public.photos
  add column if not exists focal text check (focal is null or focal ~ '^[0-9]{1,3}% [0-9]{1,3}%$');
