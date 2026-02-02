-- Originally: migration_v8_skins_normalization.sql
-- Part of migration chain. See MIGRATIONS.md for full index.

-- MIGRATION V8: Normalize Visual Data into sheep_skins Table (Revision 4 - Clean Up)
-- Run this AFTER migration_v7

-- 1. Ensure 'sheep_skins' table exists
create table if not exists public.sheep_skins (
    id uuid default uuid_generate_v4() primary key,
    name text,
    type text default 'programmatic',
    u_data jsonb default '{}'::jsonb, 
    created_at timestamptz default now()
);

-- 0. SAFETY: Ensure skin_id is TEXT
do $$
begin
    if exists (select from information_schema.table_constraints where constraint_name = 'sheep_skin_id_fkey') then
        alter table public.sheep drop constraint sheep_skin_id_fkey;
    end if;
    if exists (select from information_schema.columns where table_name = 'sheep' and column_name = 'skin_id' and data_type = 'uuid') then
        alter table public.sheep alter column skin_id type text using skin_id::text;
    end if;
end $$;


-- 2. Migrate existing 'visual_data' from sheep to sheep_skins
do $$
declare
    sheep_record record;
    new_skin_id uuid;
    clean_visual jsonb;
begin
    for sheep_record in select * from public.sheep where visual_data is not null and (skin_id is null or skin_id::text = '') loop
        
        clean_visual := sheep_record.visual_data 
            - 'x' - 'y' - 'angle' - 'direction' 
            - 'health' - 'status' - 'careLevel' - 'prayedCount';

        insert into public.sheep_skins (name, type, u_data)
        values (
            'Sheep ' || coalesce(sheep_record.name, 'Unknown') || ' Visual', 
            'programmatic', 
            clean_visual
        )
        returning id into new_skin_id;

        update public.sheep 
        set skin_id = new_skin_id::text
        where id = sheep_record.id;
        
    end loop;
end $$;

-- 3. DROP old columns
alter table public.sheep drop column if exists visual_data;
alter table public.sheep drop column if exists visual;
