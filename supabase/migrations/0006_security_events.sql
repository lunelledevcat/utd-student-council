-- Security hardening (see SECURITY.md).

-- 1) Security events: blocked requests, rate limits, rejected uploads, denied actions, sign-ins.
--    Written only by the server (service role). RLS on with no policies = invisible to anon/authenticated tokens.
create table if not exists public.security_events (
  id bigint generated always as identity primary key,
  kind text not null,              -- e.g. trap, ua_blocked, rate_limited, unauth_write, forbidden, upload_rejected, login, logout_all
  ip_hash text,                    -- hashed, never the raw IP
  user_id uuid,
  path text,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists security_events_created_idx on public.security_events (created_at desc);
alter table public.security_events enable row level security;
revoke all on public.security_events from anon, authenticated;

-- 2) Every change of profiles.role is written to audit_logs, whoever makes it (app, SQL editor, dashboard).
create or replace function public.audit_role_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' and new.role is null then return new; end if;
  if tg_op = 'UPDATE' and new.role is not distinct from old.role then return new; end if;
  insert into public.audit_logs (actor_id, actor_email, action, target_table, target_id, detail)
  values (
    auth.uid(),
    coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email', current_user),
    'role.change', 'profiles', new.id::text,
    jsonb_build_object('email', new.email, 'from', case when tg_op = 'UPDATE' then old.role end, 'to', new.role)
  );
  return new;
end $$;
drop trigger if exists profiles_audit_role on public.profiles;
create trigger profiles_audit_role after insert or update of role on public.profiles
  for each row execute function public.audit_role_change();

-- 3) Uploads: the browser always converts to WebP before uploading; the server also checks the file's magic bytes.
update storage.buckets set allowed_mime_types = array['image/webp'], file_size_limit = 10485760 where id = 'pending';
