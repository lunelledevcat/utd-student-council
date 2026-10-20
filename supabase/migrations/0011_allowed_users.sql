-- Who gets which back-office role (besides ADMIN_EMAILS, which always wins). Server-only table: RLS on, no policies.
-- Decision order (lib/env.ts decideAccess): ADMIN_EMAILS -> admin · active row here -> its role ·
-- other @<ALLOWED_EMAIL_DOMAIN> -> signed in without access (/pending-access) · anything else -> refused.
-- profiles.role keeps following this table (lib/auth.ts), because RLS (is_staff / is_member) reads profiles.role.
create table if not exists public.allowed_users (
  email text primary key check (email = lower(btrim(email)) and email like '%_@_%'),
  role text not null check (role in ('council', 'teacher')),
  active boolean not null default true,
  -- an account several people use (e.g. the council's shared address): flagged in /admin/setup, 2FA recommended
  shared boolean not null default false,
  created_at timestamptz not null default now(),
  created_by text
);
alter table public.allowed_users enable row level security;
revoke all on public.allowed_users from anon, authenticated;

-- keep everyone who has access today: stored roles and pending invites move into the table (expand step;
-- role_invites is no longer read by the app and can be dropped later)
insert into public.allowed_users (email, role, created_by)
  select lower(btrim(p.email)), p.role, 'migration 0011' from public.profiles p where p.role in ('council', 'teacher')
  on conflict (email) do nothing;
insert into public.allowed_users (email, role, created_by)
  select lower(btrim(i.email)), i.role, 'migration 0011' from public.role_invites i where i.role in ('council', 'teacher')
  on conflict (email) do nothing;
