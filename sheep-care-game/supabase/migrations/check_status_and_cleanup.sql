-- 1. Check the status of the test schedule
SELECT id, action, scheduled_time, notify_at, is_notified 
FROM public.schedules 
WHERE action = '出發去大福';

-- 2. Clean up duplicate Cron Jobs
-- You have Job 4 and 5 running simultaneously. We should keep only one.
-- We will unschedule both and re-schedule just one to be clean.
SELECT cron.unschedule('notify-plans-every-10min');

-- 3. Re-schedule cleanly (Only one instance)
select
  cron.schedule(
    'notify-plans-every-10min',
    '*/10 * * * *',
    $$
    select
      net.http_post(
        url:='https://irahriqkrywijxngbvft.supabase.co/functions/v1/notify-plans',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer <SERVICE_ROLE_KEY>"}'::jsonb
      ) as request_id;
    $$
  );
