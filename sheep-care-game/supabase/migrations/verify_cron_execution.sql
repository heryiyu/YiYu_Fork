-- Verify Cron Execution and HTTP Response
-- Check the latest run of our new job
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
LIMIT 5;

-- Check the ACTUAL result of the HTTP request from pg_net
-- (The table name is likely '_http_response' based on your previous screenshot)
SELECT 
    id,
    status_code,
    content_type,
    created
FROM 
    net._http_response
ORDER BY 
    created DESC 
LIMIT 5;
