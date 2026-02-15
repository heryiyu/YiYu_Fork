-- Check Schedule Status again (After RLS Fix)
SELECT 
    id, 
    action, 
    scheduled_time, 
    notify_at, 
    is_notified, 
    NOW() as server_now, 
    (notify_at > NOW() - interval '1 hour' AND notify_at < NOW() + interval '15 minutes') as is_in_window
FROM 
    public.schedules 
WHERE 
    action = '出發去大福'
ORDER BY 
    created_at DESC; 
-- Check the latest one
