-- Migration V23: Formalize New Schedule System & Schema Reconciliation
-- This script reconciles the database schema with the current live state provided in JSON.

DO $$
BEGIN
    -- 1. Cleanup Obsolete Tables (If they still exist)
    DROP TABLE IF EXISTS public.spiritual_plans CASCADE;

    -- 2. Formalize Schedules Table
    -- Reality check: JSON shows columns: id, created_at, action, scheduled_time, location, created_by, notify_at, reminder_offset, is_notified, content
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' and tablename = 'schedules') THEN
        CREATE TABLE public.schedules (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            created_by UUID REFERENCES public.users(id) NOT NULL,
            action TEXT NOT NULL,
            scheduled_time TIMESTAMP WITH TIME ZONE,
            location TEXT,
            content TEXT,
            notify_at TIMESTAMP WITH TIME ZONE,
            reminder_offset INTEGER,
            is_notified BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
    ELSE
        -- Add missing columns if table exists but is incomplete
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'schedules' AND column_name = 'is_notified') THEN
            ALTER TABLE public.schedules ADD COLUMN is_notified BOOLEAN DEFAULT FALSE;
        END IF;
        -- Remove updated_at if it was mistakenly added in a previous draft (JSON doesn't have it)
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'schedules' AND column_name = 'updated_at') THEN
            ALTER TABLE public.schedules DROP COLUMN updated_at;
        END IF;
    END IF;

    -- 3. Formalize Schedule Participants Table
    -- Reality check: JSON shows columns: id, created_at, schedule_id, sheep_id, completed_at, feedback (text)
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' and tablename = 'schedule_participants') THEN
        CREATE TABLE public.schedule_participants (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            schedule_id UUID REFERENCES public.schedules(id) ON DELETE CASCADE,
            sheep_id UUID REFERENCES public.sheep(id) ON DELETE CASCADE,
            completed_at TIMESTAMP WITH TIME ZONE,
            feedback TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        ALTER TABLE public.schedule_participants ENABLE ROW LEVEL SECURITY;
    ELSE
        -- Remove status/updated_at if they were mistakenly added in a previous draft (JSON doesn't have them)
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'schedule_participants' AND column_name = 'status') THEN
            ALTER TABLE public.schedule_participants DROP COLUMN status;
        END IF;
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'schedule_participants' AND column_name = 'updated_at') THEN
            ALTER TABLE public.schedule_participants DROP COLUMN updated_at;
        END IF;
    END IF;

    -- 4. Baseline Policies (Ensure they exist and are permissive for the app)
    DROP POLICY IF EXISTS "Enable access for all users" ON public.schedules;
    CREATE POLICY "Enable access for all users" ON public.schedules FOR ALL USING (true);

    DROP POLICY IF EXISTS "Enable access for all users" ON public.schedule_participants;
    CREATE POLICY "Enable access for all users" ON public.schedule_participants FOR ALL USING (true);

    -- 5. Grant Permissions
    GRANT ALL ON TABLE public.schedules TO anon, authenticated, service_role;
    GRANT ALL ON TABLE public.schedule_participants TO anon, authenticated, service_role;

END $$;
