-- Banner 02 is now the council's real artwork (SCUTD 2026 + two memorial banners, public/banners/banner-02-N).
-- The three group photos that were registered as banner-02 (from brander/*.pdf) move to /banners/brander-N and are
-- switched off — extra slides the admin may turn on. Their row ids are kept (scripts/seed-2569.mjs keys them).
alter table public.photos
  add column if not exists hero_seconds integer check (hero_seconds is null or hero_seconds between 3 and 30);

update public.photos set static_path = '/banners/brander-' || substring(static_path from '([0-9]+)$'), is_hero = false
  where static_path ~ '^/banners/banner-02-[0-9]+$';
