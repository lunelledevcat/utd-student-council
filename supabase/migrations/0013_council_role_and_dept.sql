-- Council page by department: each member stores a fixed role and a department key.
-- Role tags and ordering on the site are derived from council_role; dept_key matches content/council-departments.json.
-- Existing rows are filled from their Thai title / department label (same rules as lib/council.ts roleFromTitle).
alter table public.members
  add column if not exists council_role text not null default 'member'
    check (council_role in ('president', 'vice_president', 'head', 'deputy_head', 'member')),
  add column if not exists dept_key text check (dept_key is null or dept_key ~ '^[a-zA-Z][a-zA-Z0-9]{0,39}$');

-- the free-text department label is no longer entered in the back office (the label comes from dept_key)
alter table public.members alter column dept set default '';

update public.members set council_role = case
    when regexp_replace(role_title, '\s', '', 'g') like 'รองประธาน%' then 'vice_president'
    when regexp_replace(role_title, '\s', '', 'g') like 'ประธาน%' then 'president'
    when regexp_replace(role_title, '\s', '', 'g') like 'รองหัวหน้า%' then 'deputy_head'
    when regexp_replace(role_title, '\s', '', 'g') like 'หัวหน้า%' then 'head'
    else 'member' end;

update public.members set dept_key = d.key
from (values ('บริหารสูงสุด', 'executive'), ('นโยบายและแบบแผน', 'policy'), ('ประชาสัมพันธ์', 'publicRelations'),
             ('เลขานุการ', 'secretariat'), ('โสตทัศนศึกษา', 'audioVisual'), ('กิจกรรมและนันทนาการ', 'activities'),
             ('ระเบียบวินัย', 'discipline'), ('เหรัญญิก', 'treasury'), ('วัดผลและประเมินผล', 'evaluation'),
             ('อาคารสถานที่และปฏิคม', 'facilities'), ('สวัสดิการ', 'welfare'), ('ศิลปะและวัฒนธรรม', 'arts')) as d(label, key)
where dept_key is null and regexp_replace(dept, '^ฝ่าย', '') = d.label;

-- public columns (anon reads members through a column list — 0002/0003/0009)
grant select (council_role, dept_key) on public.members to anon;
