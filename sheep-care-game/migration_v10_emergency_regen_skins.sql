-- MIGRATION V10: Emergency Skin Regeneration (Revision 2 - Correct Column)
-- Run this if V9 failed. This script generates NEW DEFAULT SKINS if visual_data is gone.

do $$
declare
    sheep_record record;
    new_skin_id uuid;
    clean_visual jsonb;
    repaired_count int := 0;
begin
    -- Iterate over ALL sheep that have no valid skin in sheep_skins table
    for sheep_record in 
        select s.* 
        from public.sheep s
        left join public.sheep_skins ss on s.skin_id = ss.id::text
        where ss.id is null -- No matching skin found
    loop
        
        -- Strategy: Use existing visual_data OR fallback to default white sheep
        if sheep_record.visual_data is not null then
             clean_visual := sheep_record.visual_data 
                - 'x' - 'y' - 'angle' - 'direction' 
                - 'health' - 'status' - 'careLevel' - 'prayedCount';
        else
             -- FALLBACK: Generate a random-ish default skin
             clean_visual := jsonb_build_object(
                'color', 'white',
                'accessories', '[]'::jsonb
             );
        end if;

        -- Create the Skin (Using 'data' column now)
        insert into public.sheep_skins (name, type, data)
        values (
            'Regenerated Sheep ' || coalesce(sheep_record.name, 'Unknown'), 
            'programmatic', 
            clean_visual
        )
        returning id into new_skin_id;

        -- Update the link
        update public.sheep 
        set skin_id = new_skin_id::text
        where id = sheep_record.id;
        
        repaired_count := repaired_count + 1;
    end loop;

    raise notice 'Emergency Regenerated % skins.', repaired_count;
end $$;
