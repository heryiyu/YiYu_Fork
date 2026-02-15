-- 1. Unschedule duplicate jobs
SELECT cron.unschedule(4);
SELECT cron.unschedule(6);

-- 2. Check net schema (to verify column names for future debugging)
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'net';

-- 3. Check http_response (Completed requests) - blindly trying common columns
-- This will help us see if the request failed (e.g. 404 bad URL, 401 unauth)
SELECT * FROM net.http_response ORDER BY created DESC LIMIT 5;
