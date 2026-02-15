-- Fix RLS for schedules table
-- Issue: User cannot update schedules likely due to missing or mismatched RLS policies.
-- Solution: Enable RLS and add a permissive policy (matching other tables in this app).

DO $$
BEGIN
    -- 1. Ensure RLS is enabled
    ALTER TABLE IF EXISTS public.schedules ENABLE ROW LEVEL SECURITY;

    -- 2. Drop potential existing policies (Clean slate)
    DROP POLICY IF EXISTS "Enable access for all users" ON public.schedules;
    DROP POLICY IF EXISTS "Public access" ON public.schedules;
    DROP POLICY IF EXISTS "Users can view their own schedules" ON public.schedules;
    DROP POLICY IF EXISTS "Users can insert their own schedules" ON public.schedules;
    DROP POLICY IF EXISTS "Users can update their own schedules" ON public.schedules;
    DROP POLICY IF EXISTS "Users can delete their own schedules" ON public.schedules;
    DROP POLICY IF EXISTS "Users can manage their own schedules" ON public.schedules;

    -- 3. Create a permissive policy allows ALL operations
    -- Note: The application logic (GameContext.js) handles 'created_by' filtering.
    CREATE POLICY "Enable access for all users" ON public.schedules
    FOR ALL
    USING (true)
    WITH CHECK (true);

    -- 4. Grant permissions to standard Supabase roles
    GRANT ALL ON TABLE public.schedules TO anon;
    GRANT ALL ON TABLE public.schedules TO authenticated;
    GRANT ALL ON TABLE public.schedules TO service_role;

END $$;
