-- Inspect Cron Job Command
-- This will show us the exact URL being called.
-- We are looking for '[YOUR_PROJECT_REF]' or invalid keys.
SELECT 
    jobid, 
    schedule, 
    command, 
    nodename, 
    nodeport, 
    database, 
    username, 
    active 
FROM 
    cron.job;
