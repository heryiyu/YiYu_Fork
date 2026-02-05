-- Originally: check_settings_save.sql
-- We check 'last_login' or just the raw row to see if game_data is changing.

select id, line_id, last_login, game_data 
from public.users 
where game_data is not null
order by last_login desc nulls last
limit 5;
