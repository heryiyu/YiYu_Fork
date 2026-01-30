-- DIAGNOSTIC SCRIPT
-- Run this to see the current state of your data

select 
  (select count(*) from public.sheep) as total_sheep,
  (select count(*) from public.sheep where visual_data is not null) as sheep_with_visual_data,
  (select count(*) from public.sheep where skin_id is not null) as sheep_with_skin_id,
  (select count(*) from public.sheep_skins) as total_skins,
  (select count(*) from public.sheep_skins where type = 'programmatic') as programmatic_skins;

-- Check a few rows to see what skin_id looks like
select id, name, skin_id, substr(visual_data::text, 1, 50) as visual_peek 
from public.sheep 
limit 5;
