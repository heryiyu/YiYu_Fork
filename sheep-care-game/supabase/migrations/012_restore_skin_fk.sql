-- Originally: migration_v12_restore_fk.sql
-- Part of migration chain. See MIGRATIONS.md for full index.

-- MIGRATION V12: Restore skin_id to UUID and Add Foreign Key
-- Run this to fix the Supabase join issue "0 Sheep".

do $$
begin
    update public.sheep set skin_id = null where skin_id = '';

    alter table public.sheep 
    alter column skin_id type uuid using skin_id::uuid;

    alter table public.sheep
    add constraint sheep_skin_id_fkey
    foreign key (skin_id) references public.sheep_skins(id);

end $$;
