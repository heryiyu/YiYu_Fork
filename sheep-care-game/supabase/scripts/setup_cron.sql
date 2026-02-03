-- Enable the PG_CRON extension if not enabled
create extension if not exists pg_net;
create extension if not exists pg_cron;

-- Schedule the cron job to run every 10 minutes
-- You MUST replace 'PROJECT_REF' and 'SERVICE_ROLE_KEY' with your actual values!
-- PROJECT_REF: found in your supabase URL (e.g., abcdefghijklm.supabase.co -> abcdefghijklm)
-- SERVICE_ROLE_KEY: found in Project Settings > API

SELECT cron.schedule(
  'check-spiritual-plans', -- name of the cron job
  '*/10 * * * *',          -- every 10 minutes
  $$
  select
    net.http_post(
        url:='https://PROJECT_REF.supabase.co/functions/v1/notify-plans',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer SERVICE_ROLE_KEY"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);

-- To check scheduled jobs:
-- select * from cron.job;

-- To un-schedule:
-- select cron.unschedule('check-spiritual-plans');
