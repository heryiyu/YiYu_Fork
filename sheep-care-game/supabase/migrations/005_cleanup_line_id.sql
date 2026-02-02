-- Originally: migration_v5_cleanup.sql
-- Part of migration chain. See MIGRATIONS.md for full index.

-- MIGRATION V5 (Cleanup Redundancy)
-- Run this in Supabase SQL Editor

-- 1. USERS Table Cleanup
do $$
begin
    if exists (select from information_schema.columns where table_schema = 'public' and table_name = 'users' and column_name = 'line_user_id') then
        alter table public.users drop column line_user_id;
    end if;
end $$;

-- 2. SHEEP Table Cleanup
do $$
begin
    if not exists (select from information_schema.columns where table_schema = 'public' and table_name = 'sheep' and column_name = 'user_id') then
         alter table public.sheep add column user_id text references public.users(id);
    end if;
    
    if exists (select from information_schema.columns where table_schema = 'public' and table_name = 'sheep' and column_name = 'owner_id') then
        alter table public.sheep add column if not exists user_id_temp text;
        update public.sheep set user_id_temp = owner_id;
    end if;
end $$;

do $$
begin
    if exists (select from information_schema.columns where table_schema = 'public' and table_name = 'sheep' and column_name = 'owner_id') 
       and not exists (select from information_schema.columns where table_schema = 'public' and table_name = 'sheep' and column_name = 'user_id') then
       
       alter table public.sheep rename column owner_id to user_id;
       
    elsif exists (select from information_schema.columns where table_schema = 'public' and table_name = 'sheep' and column_name = 'owner_id') 
       and exists (select from information_schema.columns where table_schema = 'public' and table_name = 'sheep' and column_name = 'user_id') then
       
       begin
           update public.sheep set user_id = owner_id where user_id is null;
           alter table public.sheep drop column owner_id;
       exception when others then
           raise notice 'Type mismatch during copy. Please check manually.';
       end;
    end if;
end $$;

-- 3. Policy Cleanup (Public Access for now?)
alter table public.users disable row level security;
alter table public.sheep disable row level security;
