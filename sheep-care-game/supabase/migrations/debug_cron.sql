-- Debug Script for Notifications

-- 1. Check if Cron Job exists
SELECT * FROM cron.job;

-- 2. Check recent Cron Job Runs (See if it tried to run and failed)
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5;

-- 3. Check Pending Schedules (Verify data exists)
SELECT id, action, scheduled_time, notify_at, is_notified 
FROM public.schedules 
WHERE is_notified = FALSE 
AND notify_at IS NOT NULL
ORDER BY notify_at DESC 
LIMIT 5;

-- 4. FORCE RUN NOW (Test Trigger)
-- Replace <SERVICE_ROLE_KEY> with your actual key before running this part!
/*
select
  net.http_post(
    url:='https://irahriqkrywijxngbvft.supabase.co/functions/v1/notify-plans',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer <SERVICE_ROLE_KEY>"}'::jsonb
  ) as request_id;
*/
