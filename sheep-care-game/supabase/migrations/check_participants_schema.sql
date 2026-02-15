-- Check schema and policies for schedule_participants
SELECT 
    column_name, 
    data_type 
FROM 
    information_schema.columns 
WHERE 
    table_name = 'schedule_participants';

SELECT 
    * 
FROM 
    pg_policies 
WHERE 
    tablename = 'schedule_participants';
