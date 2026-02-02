-- Originally: migration_v7_backfill_existing.sql
-- Part of migration chain. See MIGRATIONS.md for full index.

-- MIGRATION V7: Backfill & Randomize Existing Data (Revision 3 - FK Fix)
-- Run this AFTER migration_v6

-- 0. FIX SKIN_ID TYPE & CONSTRAINT
alter table public.sheep drop constraint if exists sheep_skin_id_fkey;
alter table public.sheep alter column skin_id type text using skin_id::text;

-- 1. Randomize Position for existing sheep
update public.sheep
set 
  x = 20 + floor(random() * 60),
  y = 20 + floor(random() * 60)
where x = 50 and y = 50;

-- 2. Initialize Gameplay Stats (if null)
update public.sheep set care_level = 0 where care_level is null;
update public.sheep set spiritual_maturity = 0 where spiritual_maturity is null;
update public.sheep set prayed_count = 0 where prayed_count is null;
update public.sheep set resurrection_progress = 0 where resurrection_progress is null;
update public.sheep set health = 60 where health is null;
update public.sheep set state = 'idle' where state is null;

-- 3. (Advanced) Attempt to rescue data from JSON if it exists there
update public.sheep
set skin_id = visual_data->>'skinId'
where skin_id is null and visual_data ? 'skinId';

-- 4. Cleanup Legacy Columns (Safe cleanup)
do $$
begin
    if exists (select from information_schema.columns where table_name = 'sheep' and column_name = 'careLevel') then
        update public.sheep set care_level = "careLevel" where "careLevel" is not null;
    end if;
end $$;
