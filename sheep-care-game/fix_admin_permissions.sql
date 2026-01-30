-- FIX: Grant Admin Permissions (Bypass RLS)
-- Since 'admin' is a special testing account used without real login, 
-- we need to explicitly allow it to be updated by the public client.

DO $$
BEGIN
    -- 1. USERS TABLE
    -- Drop old admin policies if they exist to avoid duplicates
    DROP POLICY IF EXISTS "Allow Admin Update" ON public.users;
    DROP POLICY IF EXISTS "Allow Admin Select" ON public.users;

    -- Create new permissive policies for 'admin'
    CREATE POLICY "Allow Admin Update" ON public.users
    FOR UPDATE USING ( line_id = 'admin' );

    CREATE POLICY "Allow Admin Select" ON public.users
    FOR SELECT USING ( line_id = 'admin' );
    
    -- 2. SHEEP TABLE
    DROP POLICY IF EXISTS "Allow Admin Sheep" ON public.sheep;
    
    CREATE POLICY "Allow Admin Sheep" ON public.sheep
    FOR ALL USING ( user_id = 'admin' );
    
    -- 3. SHEEP_SKINS TABLE (Public Read/Write)
    DROP POLICY IF EXISTS "Public Read Skins" ON public.sheep_skins;
    DROP POLICY IF EXISTS "Public Insert Skins" ON public.sheep_skins;

    CREATE POLICY "Public Read Skins" ON public.sheep_skins
    FOR SELECT USING ( true );
    
    CREATE POLICY "Public Insert Skins" ON public.sheep_skins
    FOR INSERT WITH CHECK ( true );

END $$;
