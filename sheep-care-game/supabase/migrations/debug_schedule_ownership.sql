-- Check Schedule Ownership and User Mapping
-- We need to ensure the user trying to update the schedule (via Line Login)
-- is actually the owner (created_by) of the schedule in the DB.

SELECT 
    s.id as schedule_id,
    s.action,
    s.scheduled_time,
    s.notify_at,
    s.created_by as schedule_owner_id,
    u.id as user_table_id,
    u.line_id as user_line_id,
    u.name as user_name,
    u.nickname as user_nickname
FROM 
    public.schedules s
JOIN 
    public.users u ON s.created_by = u.id
WHERE 
    s.action = '出發去大福';
