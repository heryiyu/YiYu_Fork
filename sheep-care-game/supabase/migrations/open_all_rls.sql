-- Open RLS for ALL relevant tables and ensure columns exist
-- Tables: schedules, schedule_participants, spiritual_plans

DO $$
BEGIN
    -- 1. update 'schedule_participants' schema
    -- Ensure feedback and completed_at exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'schedule_participants' AND column_name = 'feedback') THEN
        ALTER TABLE public.schedule_participants ADD COLUMN feedback JSONB DEFAULT '{}'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'schedule_participants' AND column_name = 'completed_at') THEN
        ALTER TABLE public.schedule_participants ADD COLUMN completed_at TIMESTAMPTZ DEFAULT NULL;
    END IF;

    -- 2. Open RLS for 'schedules'
    ALTER TABLE IF EXISTS public.schedules ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Enable access for all users" ON public.schedules;
    CREATE POLICY "Enable access for all users" ON public.schedules FOR ALL USING (true) WITH CHECK (true);
    GRANT ALL ON TABLE public.schedules TO anon, authenticated, service_role;

    -- 3. Open RLS for 'schedule_participants'
    ALTER TABLE IF EXISTS public.schedule_participants ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Enable all access for all users" ON public.schedule_participants;
    DROP POLICY IF EXISTS "Allow access to participants" ON public.schedule_participants;
    CREATE POLICY "Enable all access for all users" ON public.schedule_participants FOR ALL USING (true) WITH CHECK (true);
    GRANT ALL ON TABLE public.schedule_participants TO anon, authenticated, service_role;

    -- 4. Open RLS for 'spiritual_plans' (Just in case)
    ALTER TABLE IF EXISTS public.spiritual_plans ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Public access for app" ON public.spiritual_plans;
    CREATE POLICY "Public access for app" ON public.spiritual_plans FOR ALL USING (true) WITH CHECK (true);
    GRANT ALL ON TABLE public.spiritual_plans TO anon, authenticated, service_role;

END $$;
