-- MIGRATION V6: Fix Schema Columns & standardize snake_case
-- Please run this in Supabase SQL Editor

-- 1. Add missing visual/state columns if they don't exist
alter table public.sheep add column if not exists x float default 50;
alter table public.sheep add column if not exists y float default 50;
alter table public.sheep add column if not exists angle float default 0;
alter table public.sheep add column if not exists direction int default 1;

-- 2. Add gameplay columns (snake_case preference)
-- We check if they exist first to avoid errors.
alter table public.sheep add column if not exists care_level int default 0;
alter table public.sheep add column if not exists spiritual_maturity int default 0;
alter table public.sheep add column if not exists prayed_count int default 0;
alter table public.sheep add column if not exists last_prayed_date text; -- ISO string
alter table public.sheep add column if not exists resurrection_progress int default 0;
alter table public.sheep add column if not exists skin_id text;
alter table public.sheep add column if not exists note text;
alter table public.sheep add column if not exists state text; -- 'idle', 'walk', etc.

-- 3. (Optional) Handle Legacy CamelCase Columns if they were created incorrectly before
-- If you see columns like "careLevel" in your table, you can rename them:
-- do $$
-- begin
--   if exists (select from information_schema.columns where table_name = 'sheep' and column_name = 'careLevel') then
--     alter table public.sheep rename column "careLevel" to care_level;
--   end if;
-- end $$;

-- 4. Enable RLS (Optional, but recommended if policies exist, otherwise leave disabled as per previous instruction)
-- alter table public.sheep enable row level security;
