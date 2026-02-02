-- Originally: migration_v14_fix_rls_conflict.sql
-- Part of migration chain. See MIGRATIONS.md for full index.

-- MIGRATION V14: Fix RLS Conflicts for Mobile Users
-- The default Supabase policies conflict with our Custom LINE ID system.

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
    DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
    
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'users' AND policyname = 'Public access') THEN
        CREATE POLICY "Public access" ON public.users FOR ALL USING (true) WITH CHECK (true);
    END IF;

    DROP POLICY IF EXISTS "Allow Admin Sheep" ON public.sheep;
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'sheep' AND policyname = 'Enable all access for now') THEN
        CREATE POLICY "Enable all access for now" ON public.sheep FOR ALL USING (true);
    END IF;

    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'sheep_skins' AND policyname = 'Enable access for all users') THEN
        CREATE POLICY "Enable access for all users" ON public.sheep_skins FOR ALL USING (true) WITH CHECK (true);
    END IF;

END $$;
