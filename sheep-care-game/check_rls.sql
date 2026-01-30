-- CHECK RLS POLICIES
-- See if Row Level Security is enabled and what policies exist

SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

SELECT * FROM pg_policies WHERE schemaname = 'public';
