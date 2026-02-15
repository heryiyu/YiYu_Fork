-- Diagnose pg_cron and pg_net
-- Check if the job exists
SELECT * FROM cron.job;

-- Check execution history (Any errors?)
-- Note: 'return_message' might contain curl errors or status codes
SELECT 
    jobid, 
    runid, 
    status, 
    return_message, 
    start_time, 
    end_time 
FROM 
    cron.job_run_details 
ORDER BY 
    start_time DESC 
LIMIT 10;

-- Check pg_net request queue (If accessible)
-- SELECT * FROM net.http_request_queue LIMIT 10;

