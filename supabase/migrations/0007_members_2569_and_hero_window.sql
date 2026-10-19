-- 2569 council data + hero slide windows.

-- 1) members: photo consent (null = not asked yet, false = no, true = yes), group, poster photo files
alter table public.members
  add column if not exists member_group text check (member_group is null or member_group in ('executive', 'head')),
  add column if not exists consent_photo boolean,
  -- storage key prefix: "members/2569/01" -> pending|public bucket files <key>-card.{avif,webp}, <key>-poster.{avif,webp}
  add column if not exists photo_key text check (photo_key is null or photo_key ~ '^members/[0-9]{4}/[0-9]{2}$');

-- 2) hero: optional show window (dates inclusive; null = no limit) and banner files under /banners/
alter table public.photos
  add column if not exists hero_start date,
  add column if not exists hero_end date,
  add column if not exists alt_th text,
  add column if not exists alt_en text;
alter table public.photos drop constraint if exists photos_static_path_check;
alter table public.photos add constraint photos_static_path_check check (static_path is null or static_path ~ '^/banners?/[a-z0-9-]+$');
alter table public.photos drop constraint if exists photos_credit_check;
alter table public.photos add constraint photos_credit_check check (credit is null or credit in ('school', 'council'));

-- staff may change the window like is_hero / hero_order (the council lock keeps them as they were)
create or replace function public.lock_review_columns() returns trigger
language plpgsql security definer set search_path = public as $$
declare jwt_role text := coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', 'none');
begin
  if jwt_role in ('service_role', 'none') or public.is_staff() then return new; end if;
  new.status := 'pending';
  new.reviewed_by := old.reviewed_by;
  new.reviewed_at := old.reviewed_at;
  new.reason := old.reason;
  if tg_table_name = 'photos' then
    new.is_hero := old.is_hero;
    new.hero_order := old.hero_order;
    new.hero_start := old.hero_start;
    new.hero_end := old.hero_end;
  end if;
  if tg_table_name = 'members' then
    new.consent_photo := old.consent_photo;
  end if;
  return new;
end $$;
