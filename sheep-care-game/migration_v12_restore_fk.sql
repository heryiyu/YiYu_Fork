-- MIGRATION V12: Restore skin_id to UUID and Add Foreign Key
-- Run this to fix the Supabase join issue "0 Sheep".

do $$
begin
    -- 1. Try to convert skin_id back to UUID
    -- This relies on V10 having fixed all invalid IDs.
    -- If there are still empty strings or bad data, this will fail.
    
    -- Safety: Update empty strings to NULL first (just in case)
    update public.sheep set skin_id = null where skin_id = '';

    -- Alter column type
    alter table public.sheep 
    alter column skin_id type uuid using skin_id::uuid;

    -- 2. Add Foreign Key Constraint
    -- This tells PostgREST that "sheep.skin_id" points to "sheep_skins.id"
    alter table public.sheep
    add constraint sheep_skin_id_fkey
    foreign key (skin_id) references public.sheep_skins(id);

end $$;
