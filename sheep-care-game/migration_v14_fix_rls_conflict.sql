-- MIGRATION V14: Fix RLS Conflicts for Mobile Users
-- The default Supabase policies conflict with our Custom LINE ID system.
-- We must remove the "auth.uid()" policies and rely on our "Public Access" policy.

DO $$
BEGIN
    -- 1. USERS TABLE
    -- Drop restrictive policies that require Supabase Auth login
    DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
    DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
    
    -- Ensure Public Access exists (Idempotent)
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'users' AND policyname = 'Public access') THEN
        CREATE POLICY "Public access" ON public.users FOR ALL USING (true) WITH CHECK (true);
    END IF;

    -- 2. SHEEP TABLE
    DROP POLICY IF EXISTS "Allow Admin Sheep" ON public.sheep; -- Cleanup my previous temp policy
    -- Ensure Public Access
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'sheep' AND policyname = 'Enable all access for now') THEN
        CREATE POLICY "Enable all access for now" ON public.sheep FOR ALL USING (true);
    END IF;

    -- 3. SKINS TABLE
    -- Ensure Public Access
    IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'sheep_skins' AND policyname = 'Enable access for all users') THEN
        CREATE POLICY "Enable access for all users" ON public.sheep_skins FOR ALL USING (true) WITH CHECK (true);
    END IF;

END $$;
