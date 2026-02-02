-- Originally: migration_v3.sql
-- Part of migration chain. See MIGRATIONS.md for full index.

-- MIGRATION V3 (Type Fix)
-- Run this in Supabase SQL Editor

-- 1. USERS Table Updates
do $$
begin
    -- Add 'line_user_id' for LINE integration
    if not exists (select from information_schema.columns where table_schema = 'public' and table_name = 'users' and column_name = 'line_user_id') then
        alter table public.users add column line_user_id text unique;
    end if;

    -- Add 'coins' for economy
    if not exists (select from information_schema.columns where table_schema = 'public' and table_name = 'users' and column_name = 'coins') then
        alter table public.users add column coins int default 0;
    end if;
end $$;

-- 2. SHEEP Table Updates
do $$
begin
    -- Check if 'owner_id' exists and 'user_id' is missing
    if exists (select from information_schema.columns where table_schema = 'public' and table_name = 'sheep' and column_name = 'owner_id') 
       and not exists (select from information_schema.columns where table_schema = 'public' and table_name = 'sheep' and column_name = 'user_id') then
        
        -- Create user_id column
        alter table public.sheep add column user_id uuid references auth.users;
        
        -- Copy owner_id to user_id with explicit CAST
        begin
            execute 'update public.sheep set user_id = owner_id::uuid where user_id is null';
        exception when others then
            raise notice 'Could not automatically cast some owner_ids to uuid. Please check data quality.';
        end;
    end if;

    -- If user_id still doesn't exist (e.g. fresh start), create it
    if not exists (select from information_schema.columns where table_schema = 'public' and table_name = 'sheep' and column_name = 'user_id') 
       and not exists (select from information_schema.columns where table_schema = 'public' and table_name = 'sheep' and column_name = 'owner_id') then
       
        alter table public.sheep add column user_id uuid references auth.users;
    end if;

    -- Add 'type'
    if not exists (select from information_schema.columns where table_schema = 'public' and table_name = 'sheep' and column_name = 'type') then
        alter table public.sheep add column type text default 'LAMB';
    end if;
end $$;

-- 3. RLS Policy Updates
do $$
begin
    drop policy if exists "Users can view their own profile" on public.users;
    drop policy if exists "Users can update their own profile" on public.users;
    
    create policy "Users can view their own profile" on public.users for select using ( auth.uid() = id );
    create policy "Users can update their own profile" on public.users for update using ( auth.uid() = id );

    drop policy if exists "Users can view their own sheep" on public.sheep;
    drop policy if exists "Users can insert their own sheep" on public.sheep;
    drop policy if exists "Users can update their own sheep" on public.sheep;
    drop policy if exists "Users can delete their own sheep" on public.sheep;

    create policy "Users can view their own sheep" on public.sheep for select using ( auth.uid() = user_id );
    create policy "Users can insert their own sheep" on public.sheep for insert with check ( auth.uid() = user_id );
    create policy "Users can update their own sheep" on public.sheep for update using ( auth.uid() = user_id );
    create policy "Users can delete their own sheep" on public.sheep for delete using ( auth.uid() = user_id );
end $$;
