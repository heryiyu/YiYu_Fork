-- Check Cron Job Execution History
-- Please run this and examine the "status" and "return_message" columns.

SELECT 
    jobid,
    runid,
    username,
    status,
    return_message,
    start_time,
    end_time
FROM 
    cron.job_run_details 
ORDER BY 
    start_time DESC 
LIMIT 10;
