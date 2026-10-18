-- UTD Student Council — schema, RLS, storage buckets.
-- Run in Supabase SQL editor or `supabase db push`. Idempotent where practical.
-- Server code uses the service-role key ONLY after checking the caller's role (lib/auth.ts); RLS below is defence in depth
-- and is what the anon / user-session clients are bound by.

create extension if not exists pgcrypto;

-- ───────────────────────── tables ─────────────────────────

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role text check (role in ('council', 'teacher', 'admin')),
  created_at timestamptz not null default now(),
  last_login_at timestamptz
);

-- pre-assigned roles: admin adds an email before that person has ever logged in
create table if not exists public.role_invites (
  email text primary key,
  role text not null check (role in ('council', 'teacher')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.albums (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now()
);

-- Every user-submitted row shares this review workflow:
--   pending -> approved | rejected (with reason) ; rejected -> pending (resubmit) ; approved -> hidden
create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  album_id uuid references public.albums(id) on delete set null,
  event_slug text,
  caption text not null default '',
  width int not null,
  height int not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'hidden')),
  hero_requested boolean not null default false,
  is_hero boolean not null default false,
  hero_order int not null default 0,
  uploaded_by uuid not null references auth.users(id),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  tag text not null default 'ข่าวสภา',
  excerpt text not null default '',
  body text not null default '',          -- paragraphs separated by a blank line
  published_on date not null default current_date,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'hidden')),
  author_id uuid references auth.users(id),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  event_date date not null,
  event_time text not null default '',
  place text not null default '',
  summary text not null default '',
  body text not null default '',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'hidden')),
  author_id uuid references auth.users(id),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- PUBLIC data only: name + position + department + grade. Never phone / email / student id.
create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role_title text not null,
  dept text not null,
  grade text not null,
  sort_order int not null default 0,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'hidden')),
  author_id uuid references auth.users(id),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.voice_messages (
  id uuid primary key default gen_random_uuid(),
  ref_code text not null unique,
  category text not null,
  message text not null,
  anonymous boolean not null default true,
  ip_hash text not null,                 -- sha256(ip + secret); raw IP is never stored
  status text not null default 'received' check (status in ('received', 'reviewing', 'answered')),
  created_at timestamptz not null default now()
);

create table if not exists public.voice_replies (
  id uuid primary key default gen_random_uuid(),
  voice_id uuid not null references public.voice_messages(id) on delete cascade,
  body text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'hidden')),
  author_id uuid references auth.users(id),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid,
  actor_email text,
  action text not null,
  target_table text,
  target_id text,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists photos_status_idx on public.photos (status, created_at desc);
create index if not exists photos_hero_idx on public.photos (is_hero, hero_order) where is_hero;
create index if not exists news_status_idx on public.news (status, published_on desc);
create index if not exists events_status_idx on public.events (status, event_date);
create index if not exists voice_replies_voice_idx on public.voice_replies (voice_id);
create index if not exists audit_logs_created_idx on public.audit_logs (created_at desc);

-- ───────────────────────── helpers ─────────────────────────

-- Role of the calling user. SECURITY DEFINER so policies can read profiles without recursion.
create or replace function public.current_app_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.current_app_role() in ('teacher', 'admin'), false)
$$;

create or replace function public.is_member() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.current_app_role() in ('council', 'teacher', 'admin'), false)
$$;

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger news_touch before update on public.news for each row execute function public.touch_updated_at();
create trigger events_touch before update on public.events for each row execute function public.touch_updated_at();
create trigger members_touch before update on public.members for each row execute function public.touch_updated_at();

-- A council member can never self-approve: whatever they send, review columns stay as they were and status resets to 'pending'.
create or replace function public.lock_review_columns() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.is_staff() then return new; end if;
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

create trigger photos_lock before update on public.photos for each row execute function public.lock_review_columns();
create trigger news_lock before update on public.news for each row execute function public.lock_review_columns();
create trigger events_lock before update on public.events for each row execute function public.lock_review_columns();
create trigger members_lock before update on public.members for each row execute function public.lock_review_columns();

-- ───────────────────────── RLS ─────────────────────────

alter table public.profiles enable row level security;
alter table public.role_invites enable row level security;
alter table public.albums enable row level security;
alter table public.photos enable row level security;
alter table public.news enable row level security;
alter table public.events enable row level security;
alter table public.members enable row level security;
alter table public.voice_messages enable row level security;
alter table public.voice_replies enable row level security;
alter table public.audit_logs enable row level security;

-- profiles: read your own row; admin reads all. No client writes (service role only).
create policy profiles_self_read on public.profiles for select to authenticated using (id = auth.uid());
create policy profiles_admin_read on public.profiles for select to authenticated using (public.current_app_role() = 'admin');

-- role_invites, audit_logs: no client policies except admin read of logs. Writes = service role.
create policy audit_admin_read on public.audit_logs for select to authenticated using (public.current_app_role() = 'admin');

-- albums: public read; staff write
create policy albums_public_read on public.albums for select to anon, authenticated using (true);
create policy albums_staff_write on public.albums for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- photos / news / events / members share one pattern
do $$
declare t text; author_col text;
begin
  foreach t in array array['photos', 'news', 'events', 'members'] loop
    author_col := case when t = 'photos' then 'uploaded_by' else 'author_id' end;

    -- public sees approved only
    execute format('create policy %I on public.%I for select to anon, authenticated using (status = ''approved'')', t || '_public_read', t);
    -- members see their own rows in any state; staff see everything
    execute format('create policy %I on public.%I for select to authenticated using (%I = auth.uid() or public.is_staff())', t || '_own_read', t, author_col);
    -- members insert only as themselves and only as pending
    execute format('create policy %I on public.%I for insert to authenticated with check (public.is_member() and %I = auth.uid() and status = ''pending'')', t || '_member_insert', t, author_col);
    -- council edits own unreviewed/rejected rows (trigger forces status back to pending); staff edit anything
    execute format('create policy %I on public.%I for update to authenticated using (public.is_staff() or (%I = auth.uid() and status in (''pending'', ''rejected''))) with check (public.is_staff() or %I = auth.uid())', t || '_update', t, author_col, author_col);
    -- delete: staff, or own pending
    execute format('create policy %I on public.%I for delete to authenticated using (public.is_staff() or (%I = auth.uid() and status = ''pending''))', t || '_delete', t, author_col);
  end loop;
end $$;

-- voice: public can't read or write at all (server inserts with service role after Turnstile + rate limit).
-- Council+ can read messages but never ip_hash.
revoke all on public.voice_messages from anon, authenticated;
grant select (id, ref_code, category, message, anonymous, status, created_at) on public.voice_messages to authenticated;
create policy voice_member_read on public.voice_messages for select to authenticated using (public.is_member());

-- replies: members write pending replies; only approved replies are ever shown (server reads via service role by ref_code)
create policy replies_member_read on public.voice_replies for select to authenticated using (public.is_member());
create policy replies_member_insert on public.voice_replies for insert to authenticated with check (public.is_member() and author_id = auth.uid() and status = 'pending');
create policy replies_staff_update on public.voice_replies for update to authenticated using (public.is_staff()) with check (public.is_staff());

-- ───────────────────────── storage ─────────────────────────
-- pending: private (uploads + processed variants awaiting approval). public: served to visitors after approval.
-- Browsers never write with their own token: the server hands out one-time signed upload URLs after checking role.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('pending', 'pending', false, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('public', 'public', true, 10485760, array['image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
