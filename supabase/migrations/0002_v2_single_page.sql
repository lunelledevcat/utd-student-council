-- v2: single-page site (tabs + popups), everything scoped to an academic year.
-- Run after 0001. Keeps existing rows: news -> announcements, events -> activities are renamed, not recreated
-- (their RLS policies and triggers follow the rename).

-- ───────────────────────── academic years ─────────────────────────

create table if not exists public.academic_years (
  year int primary key check (year between 2500 and 2700),   -- Buddhist era, e.g. 2569
  is_current boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index if not exists academic_years_one_current on public.academic_years ((true)) where is_current;

insert into public.academic_years (year, is_current)
values (extract(year from now() at time zone 'Asia/Bangkok')::int + 543, true)
on conflict (year) do nothing;

-- default for new rows = the current year
create or replace function public.current_academic_year() returns int
language sql stable security definer set search_path = public as $$
  select coalesce((select year from public.academic_years where is_current), (select max(year) from public.academic_years))
$$;

alter table public.academic_years enable row level security;
create policy academic_years_public_read on public.academic_years for select to anon, authenticated using (true);
-- writes: admin only, through the service role after lib/auth.ts checks the role

-- ───────────────────────── photos: links + blur placeholder ─────────────────────────

alter table public.photos
  add column if not exists activity_id uuid,
  add column if not exists policy_id uuid,
  add column if not exists sort_order int not null default 0,
  add column if not exists blur text;                -- tiny base64 webp shown while the real image loads

-- ───────────────────────── announcements (was news) ─────────────────────────

alter table if exists public.news rename to announcements;
alter table public.announcements
  add column if not exists year int not null default public.current_academic_year() references public.academic_years(year),
  add column if not exists link_url text check (link_url is null or link_url ~ '^https://'),
  add column if not exists cover_photo_id uuid references public.photos(id) on delete set null,
  add column if not exists pinned boolean not null default false;
alter table public.announcements alter column slug drop not null;
create index if not exists announcements_year_idx on public.announcements (year, status, published_on desc);

-- ───────────────────────── activities (was events) ─────────────────────────

alter table if exists public.events rename to activities;
alter table public.activities
  add column if not exists year int not null default public.current_academic_year() references public.academic_years(year);
alter table public.activities alter column slug drop not null;
create index if not exists activities_year_idx on public.activities (year, status, event_date desc);

alter table public.photos
  drop constraint if exists photos_activity_fk,
  add constraint photos_activity_fk foreign key (activity_id) references public.activities(id) on delete cascade;

-- ───────────────────────── policies ─────────────────────────

create table if not exists public.policies (
  id uuid primary key default gen_random_uuid(),
  year int not null default public.current_academic_year() references public.academic_years(year),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,80}$'),
  title text not null,
  summary text not null default '',
  body text not null default '',
  progress_status text not null default 'planned' check (progress_status in ('planned', 'in-progress', 'done')),
  progress int not null default 0 check (progress between 0 and 100),
  owner text not null default '',                     -- ผู้รับผิดชอบ (free text)
  timeline jsonb not null default '[]'::jsonb,        -- [{ "date": "YYYY-MM-DD", "text": "..." }]
  cover_photo_id uuid references public.photos(id) on delete set null,
  sort_order int not null default 0,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'hidden')),
  author_id uuid references auth.users(id),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists policies_year_idx on public.policies (year, status, sort_order);

alter table public.photos
  drop constraint if exists photos_policy_fk,
  add constraint photos_policy_fk foreign key (policy_id) references public.policies(id) on delete cascade;

-- ───────────────────────── members: full profile ─────────────────────────
-- Public card: photo, name, role_title, party. Popup adds nickname, term_no, exec_title, dept.
-- instagram / contact are stored but only ever sent to visitors when consent_public = true (lib/content.ts).

alter table public.members
  add column if not exists year int not null default public.current_academic_year() references public.academic_years(year),
  add column if not exists nickname text not null default '',
  add column if not exists term_no text not null default '',       -- วาระครั้งที่
  add column if not exists exec_title text not null default '',    -- ตำแหน่ง (ผู้บริหาร)
  add column if not exists party text not null default '',
  add column if not exists instagram text not null default '' check (instagram ~ '^[A-Za-z0-9._]{0,30}$'),
  add column if not exists contact text not null default '',
  add column if not exists consent_public boolean not null default false,
  add column if not exists photo_id uuid references public.photos(id) on delete set null;
alter table public.members alter column grade set default '';
create index if not exists members_year_idx on public.members (year, status, sort_order);

-- ───────────────────────── advisors ─────────────────────────

create table if not exists public.advisors (
  id uuid primary key default gen_random_uuid(),
  year int not null default public.current_academic_year() references public.academic_years(year),
  name text not null,
  nickname text not null default '',
  role_label text not null default 'ครูที่ปรึกษา',   -- badge text
  subject_group text not null default '',             -- กลุ่มสาระ
  position text not null default '',                  -- ตำแหน่ง (วิทยฐานะ ฯลฯ)
  instagram text not null default '' check (instagram ~ '^[A-Za-z0-9._]{0,30}$'),
  contact text not null default '',
  consent_public boolean not null default false,
  photo_id uuid references public.photos(id) on delete set null,
  sort_order int not null default 0,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'hidden')),
  author_id uuid references auth.users(id),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists advisors_year_idx on public.advisors (year, status, sort_order);

-- ───────────────────────── triggers + RLS for the new tables ─────────────────────────

create trigger policies_touch before update on public.policies for each row execute function public.touch_updated_at();
create trigger advisors_touch before update on public.advisors for each row execute function public.touch_updated_at();
create trigger policies_lock before update on public.policies for each row execute function public.lock_review_columns();
create trigger advisors_lock before update on public.advisors for each row execute function public.lock_review_columns();

alter table public.policies enable row level security;
alter table public.advisors enable row level security;

do $$
declare t text;
begin
  foreach t in array array['policies', 'advisors'] loop
    execute format('create policy %I on public.%I for select to anon, authenticated using (status = ''approved'')', t || '_public_read', t);
    execute format('create policy %I on public.%I for select to authenticated using (author_id = auth.uid() or public.is_staff())', t || '_own_read', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.is_member() and author_id = auth.uid() and status = ''pending'')', t || '_member_insert', t);
    execute format('create policy %I on public.%I for update to authenticated using (public.is_staff() or (author_id = auth.uid() and status in (''pending'', ''rejected''))) with check (public.is_staff() or author_id = auth.uid())', t || '_update', t);
    execute format('create policy %I on public.%I for delete to authenticated using (public.is_staff() or (author_id = auth.uid() and status = ''pending''))', t || '_delete', t);
  end loop;
end $$;

-- The anon key can never read instagram / contact (a column REVOKE does not override a table GRANT, so the table grant
-- is replaced by a column list). lib/content.ts reads consented contacts server-side with the service role,
-- filtered on status = 'approved' and consent_public = true.
revoke select on public.members from anon;
grant select (id, year, name, nickname, role_title, term_no, exec_title, dept, party, grade, photo_id, sort_order, status, consent_public)
  on public.members to anon;
revoke select on public.advisors from anon;
grant select (id, year, name, nickname, role_label, subject_group, position, photo_id, sort_order, status, consent_public)
  on public.advisors to anon;
