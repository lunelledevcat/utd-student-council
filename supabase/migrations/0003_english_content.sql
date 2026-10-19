-- Optional English versions of public content. Empty string = not translated -> the site shows the Thai text
-- with a small "TH" label. Timeline steps (policies.timeline jsonb) may carry an optional "text_en" key.

alter table public.announcements
  add column if not exists title_en text not null default '',
  add column if not exists body_en text not null default '';

alter table public.activities
  add column if not exists title_en text not null default '',
  add column if not exists body_en text not null default '';

alter table public.policies
  add column if not exists title_en text not null default '',
  add column if not exists summary_en text not null default '',
  add column if not exists body_en text not null default '',
  add column if not exists owner_en text not null default '';

alter table public.members
  add column if not exists name_en text not null default '',
  add column if not exists nickname_en text not null default '',
  add column if not exists role_title_en text not null default '',
  add column if not exists exec_title_en text not null default '',
  add column if not exists dept_en text not null default '',
  add column if not exists party_en text not null default '';

alter table public.advisors
  add column if not exists name_en text not null default '',
  add column if not exists nickname_en text not null default '',
  add column if not exists role_label_en text not null default '',
  add column if not exists subject_group_en text not null default '',
  add column if not exists position_en text not null default '';

-- 0002 replaced the anon table grants on members/advisors with column lists; extend them with the new public columns.
grant select (name_en, nickname_en, role_title_en, exec_title_en, dept_en, party_en) on public.members to anon;
grant select (name_en, nickname_en, role_label_en, subject_group_en, position_en) on public.advisors to anon;
