-- Originally: migration.sql
-- Part of migration chain. See MIGRATIONS.md for full index.

-- SAFE MIGRATION SCRIPT
-- Copy and paste this into Supabase SQL Editor to update existing tables.

-- 1. Ensure extensions
create extension if not exists "uuid-ossp";

-- 2. Update USERS table safely
do $$
begin
    -- Create table if not exists (Basic structure)
    if not exists (select from pg_tables where schemaname = 'public' and tablename = 'users') then
        create table public.users (
            id uuid references auth.users not null primary key,
            created_at timestamptz default now()
        );
        alter table public.users enable row level security;
    end if;

    -- Add columns if missing
    if not exists (select from information_schema.columns where table_schema = 'public' and table_name = 'users' and column_name = 'line_user_id') then
        alter table public.users add column line_user_id text unique;
    end if;

    if not exists (select from information_schema.columns where table_schema = 'public' and table_name = 'users' and column_name = 'coins') then
        alter table public.users add column coins int default 0;
    end if;

    if not exists (select from information_schema.columns where table_schema = 'public' and table_name = 'users' and column_name = 'last_login_at') then
        alter table public.users add column last_login_at timestamptz default now();
    end if;
    
    if not exists (select from information_schema.columns where table_schema = 'public' and table_name = 'users' and column_name = 'display_name') then
        alter table public.users add column display_name text;
    end if;
end $$;

-- 3. Update SHEEP table safely
do $$
begin
    -- Create table if not exists
    if not exists (select from pg_tables where schemaname = 'public' and tablename = 'sheep') then
        create table public.sheep (
            id uuid default uuid_generate_v4() primary key,
            user_id uuid references public.users(id) not null,
            created_at timestamptz default now()
        );
        alter table public.sheep enable row level security;
    end if;

    -- Add columns if missing
    if not exists (select from information_schema.columns where table_schema = 'public' and table_name = 'sheep' and column_name = 'name') then
        alter table public.sheep add column name text default 'New Sheep';
    end if;

    if not exists (select from information_schema.columns where table_schema = 'public' and table_name = 'sheep' and column_name = 'status') then
        alter table public.sheep add column status text default 'healthy';
    end if;

    if not exists (select from information_schema.columns where table_schema = 'public' and table_name = 'sheep' and column_name = 'health') then
        alter table public.sheep add column health float default 100.0;
    end if;

    if not exists (select from information_schema.columns where table_schema = 'public' and table_name = 'sheep' and column_name = 'care_level') then
        alter table public.sheep add column care_level float default 50.0;
    end if;

    if not exists (select from information_schema.columns where table_schema = 'public' and table_name = 'sheep' and column_name = 'type') then
        alter table public.sheep add column type text default 'LAMB';
    end if;

    if not exists (select from information_schema.columns where table_schema = 'public' and table_name = 'sheep' and column_name = 'visual') then
        alter table public.sheep add column visual jsonb default '{}'::jsonb;
    end if;

    if not exists (select from information_schema.columns where table_schema = 'public' and table_name = 'sheep' and column_name = 'spiritual_maturity') then
        alter table public.sheep add column spiritual_maturity text default '新朋友';
    end if;

    if not exists (select from information_schema.columns where table_schema = 'public' and table_name = 'sheep' and column_name = 'updated_at') then
        alter table public.sheep add column updated_at timestamptz default now();
    end if;
end $$;

-- 4. Re-apply Policies (Drop first to avoid conflicts, then recreate)
-- WARNING: This resets policies. If you have custom policies, please check manually.
do $$
begin
    -- USERS Policies
    drop policy if exists "Users can view their own profile" on public.users;
    drop policy if exists "Users can update their own profile" on public.users;
    
    create policy "Users can view their own profile" on public.users for select using ( auth.uid() = id );
    create policy "Users can update their own profile" on public.users for update using ( auth.uid() = id );

    -- SHEEP Policies
    drop policy if exists "Users can view their own sheep" on public.sheep;
    drop policy if exists "Users can insert their own sheep" on public.sheep;
    drop policy if exists "Users can update their own sheep" on public.sheep;
    drop policy if exists "Users can delete their own sheep" on public.sheep;

    create policy "Users can view their own sheep" on public.sheep for select using ( auth.uid() = user_id );
    create policy "Users can insert their own sheep" on public.sheep for insert with check ( auth.uid() = user_id );
    create policy "Users can update their own sheep" on public.sheep for update using ( auth.uid() = user_id );
    create policy "Users can delete their own sheep" on public.sheep for delete using ( auth.uid() = user_id );
end $$;
