-- DIAGNOSTIC: Check Sheep Ownership and Integrity
-- Run this to see why "0 Sheep" are loading.

select 
    id, 
    user_id, 
    name, 
    skin_id, 
    (select count(*) from public.sheep_skins where id::text = sheep.skin_id) as skin_exists
from public.sheep;
