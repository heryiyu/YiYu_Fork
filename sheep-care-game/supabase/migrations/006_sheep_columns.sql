-- Originally: migration_v6_schema_fix.sql
-- Part of migration chain. See MIGRATIONS.md for full index.

-- MIGRATION V6: Fix Schema Columns & standardize snake_case
-- Please run this in Supabase SQL Editor

-- 1. Add missing visual/state columns if they don't exist
alter table public.sheep add column if not exists x float default 50;
alter table public.sheep add column if not exists y float default 50;
alter table public.sheep add column if not exists angle float default 0;
alter table public.sheep add column if not exists direction int default 1;

-- 2. Add gameplay columns (snake_case preference)
alter table public.sheep add column if not exists care_level int default 0;
alter table public.sheep add column if not exists spiritual_maturity int default 0;
alter table public.sheep add column if not exists prayed_count int default 0;
alter table public.sheep add column if not exists last_prayed_date text;
alter table public.sheep add column if not exists resurrection_progress int default 0;
alter table public.sheep add column if not exists skin_id text;
alter table public.sheep add column if not exists note text;
alter table public.sheep add column if not exists state text;
