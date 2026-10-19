-- Anonymous visitors read members through a column list (instagram / contact stay hidden — 0002). The new 2569 columns
-- must be added to that list: group (card grouping), consent_photo (photos only with consent) and photo_key (file name).
grant select (member_group, consent_photo, photo_key) on public.members to anon;
