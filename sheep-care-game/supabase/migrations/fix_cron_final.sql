-- Clean up and Re-setup Cron Job (Easier Auth Version)
-- 1. Unschedule duplicate/old jobs
DO $$
DECLARE
    r record;
BEGIN
    FOR r IN SELECT jobid FROM cron.job WHERE command LIKE '%notify-plans%' LOOP
        PERFORM cron.unschedule(r.jobid);
    END LOOP;
END $$;

-- 2. Create the ONE correct job using ANON KEY
-- IMPORTANT: You MUST replace [YOUR_ANON_KEY] below.
-- You can find this easily in Project Settings > API > anon public key
-- The Edge Function handles its own service_role permission internally.

SELECT cron.schedule(
    'notify-plans', -- unique name
    '*/10 * * * *', -- every 10 minutes
    $$
    SELECT net.http_post(
        url:='https://irahriqkrywijxngbvft.supabase.co/functions/v1/notify-plans',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer [YOUR_ANON_KEY]"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
    $$
);

-- 3. Check 'net' schema tables again just to be sure
SELECT table_name FROM information_schema.tables WHERE table_schema = 'net';
