-- Originally: migration_v15_force_update.sql
-- Part of migration chain. See MIGRATIONS.md for full index.

-- MIGRATION V15: FORCE FIX Users Update Permissions and Schema
-- This script is the "Nuclear Option" for fixing "Update settings failed".

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'game_data') THEN
        ALTER TABLE public.users ADD COLUMN game_data JSONB DEFAULT '{}'::jsonb;
    END IF;

    DROP POLICY IF EXISTS "Public access" ON public.users;
    DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
    DROP POLICY IF EXISTS "Enable insert for all users" ON public.users;
    DROP POLICY IF EXISTS "Enable update for all users" ON public.users;
    
    CREATE POLICY "Public access" ON public.users FOR ALL USING (true) WITH CHECK (true);

    GRANT ALL ON TABLE public.users TO anon;
    GRANT ALL ON TABLE public.users TO authenticated;
    GRANT ALL ON TABLE public.users TO service_role;

END $$;
