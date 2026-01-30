-- MIGRATION V11: Transfer Ownership to Admin
-- Run this to move ALL sheep to the 'admin' account so you can see them.

update public.sheep
set user_id = 'admin'
where user_id != 'admin';

-- Verify the result
select id, name, user_id from public.sheep;
