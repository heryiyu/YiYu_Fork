-- Originally: migration_v2.sql
-- Part of migration chain. See MIGRATIONS.md for full index.

-- MIGRATION V2 (Adapted for Existing Schema)
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

    -- Note: We will use existing 'nickname' as display name, and 'last_login' as last login time.
end $$;

-- 2. SHEEP Table Updates
do $$
begin
    -- Standardize 'user_id'. If 'owner_id' exists but 'user_id' is missing, add 'user_id' and copy data.
    if exists (select from information_schema.columns where table_schema = 'public' and table_name = 'sheep' and column_name = 'owner_id') 
       and not exists (select from information_schema.columns where table_schema = 'public' and table_name = 'sheep' and column_name = 'user_id') then
        
        alter table public.sheep add column user_id uuid references auth.users;
        -- Copy owner_id to user_id
        execute 'update public.sheep set user_id = owner_id where user_id is null';
    end if;

    -- If neither exists (unlikely given your input), create user_id
    if not exists (select from information_schema.columns where table_schema = 'public' and table_name = 'sheep' and column_name = 'user_id') 
       and not exists (select from information_schema.columns where table_schema = 'public' and table_name = 'sheep' and column_name = 'owner_id') then
       
        alter table public.sheep add column user_id uuid references auth.users;
    end if;

    -- Add 'type' (e.g., LAMB, STRONG, GLORY)
    if not exists (select from information_schema.columns where table_schema = 'public' and table_name = 'sheep' and column_name = 'type') then
        alter table public.sheep add column type text default 'LAMB';
    end if;

    -- Note: We will use 'visual_data' (existing) instead of 'visual'.
    -- Note: We will use 'last_prayed_date' (existing).
end $$;

-- 3. RLS Policy Updates (Ensure safety)
do $$
begin
    -- Users Policies
    drop policy if exists "Users can view their own profile" on public.users;
    drop policy if exists "Users can update their own profile" on public.users;
    
    create policy "Users can view their own profile" on public.users for select using ( auth.uid() = id );
    create policy "Users can update their own profile" on public.users for update using ( auth.uid() = id );

    -- Sheep Policies
    -- Note: RLS needs to check the correct column (user_id)
    drop policy if exists "Users can view their own sheep" on public.sheep;
    drop policy if exists "Users can insert their own sheep" on public.sheep;
    drop policy if exists "Users can update their own sheep" on public.sheep;
    drop policy if exists "Users can delete their own sheep" on public.sheep;

    create policy "Users can view their own sheep" on public.sheep for select using ( auth.uid() = user_id );
    create policy "Users can insert their own sheep" on public.sheep for insert with check ( auth.uid() = user_id );
    create policy "Users can update their own sheep" on public.sheep for update using ( auth.uid() = user_id );
    create policy "Users can delete their own sheep" on public.sheep for delete using ( auth.uid() = user_id );
end $$;
