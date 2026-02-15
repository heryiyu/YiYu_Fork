-- Check if the user who created the schedule has a valid LINE ID
SELECT 
    s.id as schedule_id,
    s.action,
    s.created_by as user_id,
    u.line_id,
    u.name as user_name
FROM 
    public.schedules s
JOIN 
    public.users u ON s.created_by = u.id
WHERE 
    s.action = '出發去大福';
