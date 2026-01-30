-- CHECK TABLE COLUMNS
-- Run this to see what columns are actually in your 'sheep_skins' table

select column_name, data_type, is_nullable
from information_schema.columns 
where table_name = 'sheep_skins'
order by ordinal_position;
