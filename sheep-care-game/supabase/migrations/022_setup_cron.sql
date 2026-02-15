-- Migration: Setup Cron Job for Notifications
-- Created at: 2026-02-15

-- 1. Enable Extensions
-- ⚠️ IMPORTANT: If you see "dependent privileges exist" error, please enable extensions via Dashboard:
-- Go to Supabase Dashboard -> Database -> Extensions -> Search for "pg_cron" and "pg_net" -> Enable them.
-- 
-- create extension if not exists pg_cron;
-- create extension if not exists pg_net;

-- 2. Schedule Job (Checks every 10 minutes)
-- IMPORTANT: You must replace <SERVICE_ROLE_KEY> with your actual Service Role Secret.
-- You can find it in Supabase Dashboard -> Settings -> API -> service_role secret.

select
  cron.schedule(
    'notify-plans-every-10min', -- Job Name
    '*/10 * * * *',           -- Schedule (Every 10 min)
    $$
    select
      net.http_post(
        url:='https://irahriqkrywijxngbvft.supabase.co/functions/v1/notify-plans',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer <SERVICE_ROLE_KEY>"}'::jsonb
      ) as request_id;
    $$
  );

-- To verify if it's running, you can check:
-- select * from cron.job_run_details order by start_time desc;
