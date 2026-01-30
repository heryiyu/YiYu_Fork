-- MIGRATION V9: Repair Broken Skin Links
-- Run this to fix sheep that have a skin_id that points to NOWHERE.

do $$
declare
    sheep_record record;
    new_skin_id uuid;
    clean_visual jsonb;
    broken_count int := 0;
begin
    -- 1. Identify rows with BROKEN links
    -- Conditions: 
    --   1. skin_id is NOT NULL
    --   2. skin_id is NOT in the sheep_skins table
    --   3. visual_data IS NOT NULL (so we have source data to fix it)
    
    for sheep_record in 
        select * from public.sheep 
        where skin_id is not null 
          and skin_id::text not in (select id::text from public.sheep_skins)
          and visual_data is not null
    loop
        
        -- Clean the JSON (Remove physics/gameplay state)
        clean_visual := sheep_record.visual_data 
            - 'x' - 'y' - 'angle' - 'direction' 
            - 'health' - 'status' - 'careLevel' - 'prayedCount';

        -- Create a new Skin
        insert into public.sheep_skins (name, type, u_data)
        values (
            'Repaired Sheep ' || coalesce(sheep_record.name, 'Unknown'), 
            'programmatic', 
            clean_visual
        )
        returning id into new_skin_id;

        -- Fix the link
        update public.sheep 
        set skin_id = new_skin_id::text,
            visual_data = null -- Cleanup
        where id = sheep_record.id;
        
        broken_count := broken_count + 1;
    end loop;

    raise notice 'Repaired % sheep with broken skin links.', broken_count;
end $$;
