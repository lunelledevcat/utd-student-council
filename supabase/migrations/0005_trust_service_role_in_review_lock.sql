-- Fix: lock_review_columns() trusted only public.is_staff(), which reads auth.uid(). Server code performs reviews
-- (approve / reject / hide), photo publishing and hero changes with the service role AFTER checking the caller's role
-- in lib/auth.ts — but for the service role auth.uid() is null, so the trigger silently reset every one of those writes
-- back to 'pending'. Trust the service role (and direct database sessions, which carry no JWT at all — only database
-- owners have those); everyone else keeps the original rule.

create or replace function public.lock_review_columns() returns trigger language plpgsql security definer set search_path = public as $$
declare
  jwt_role text := coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', 'none');
begin
  if jwt_role in ('service_role', 'none') or public.is_staff() then return new; end if;
  new.status := 'pending';
  new.reviewed_by := old.reviewed_by;
  new.reviewed_at := old.reviewed_at;
  new.reason := old.reason;
  if tg_table_name = 'photos' then
    new.is_hero := old.is_hero;
    new.hero_order := old.hero_order;
  end if;
  return new;
end $$;
