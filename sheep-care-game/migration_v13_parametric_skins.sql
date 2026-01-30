-- MIGRATION V13: Parametric Skins Architecture
-- Goal: Debloat sheep_skins by moving attributes (color, accessories) to sheep.visual_attrs
-- Preserves 'image' skins as valid independent skins.

DO $$
DECLARE
    master_skin_id uuid;
    count_moved int;
BEGIN
    -- 1. Add 'visual_attrs' to sheep table if missing
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'sheep' AND column_name = 'visual_attrs') THEN
        ALTER TABLE public.sheep ADD COLUMN visual_attrs jsonb DEFAULT '{}'::jsonb;
    END IF;

    -- 2. Create (or find) the "Standard Sheep Template"
    -- We assume any skin with empty data and type 'programmatic' is a candidate, or we make a new one.
    -- To be safe, let's make a dedicated Master Template.
    
    SELECT id INTO master_skin_id FROM public.sheep_skins 
    WHERE name = 'Standard Sheep Template' AND type = 'programmatic' LIMIT 1;

    IF master_skin_id IS NULL THEN
        INSERT INTO public.sheep_skins (name, type, data)
        VALUES ('Standard Sheep Template', 'programmatic', '{}'::jsonb)
        RETURNING id INTO master_skin_id;
    END IF;

    RAISE NOTICE 'Master Skin ID: %', master_skin_id;

    -- 3. Migrate Data for PROGRAMMATIC skins
    -- We copy the skin's DATA into the sheep's VISUAL_ATTRS
    -- And change the sheep's SKIN_ID to the Master Skin ID.
    -- EXCLUDE 'image' skins.
    
    WITH moved_rows AS (
        UPDATE public.sheep s
        SET 
            visual_attrs = ss.data, -- Copy attributes like color/accessories
            skin_id = master_skin_id -- Point to Master Template
        FROM public.sheep_skins ss
        WHERE s.skin_id = ss.id 
          AND ss.type = 'programmatic'
          AND ss.id != master_skin_id -- Don't migrate if already on master (idempotency)
        RETURNING s.id
    )
    SELECT count(*) INTO count_moved FROM moved_rows;

    RAISE NOTICE 'Migrated % sheep to Parametric Architecture.', count_moved;

    -- 4. Cleanup: Delete old programmatic skins that are no longer used
    -- We keep the Master Skin and any Image skins.
    -- We also keep programmatic skins if they are still referenced (just in case).
    
    DELETE FROM public.sheep_skins
    WHERE type = 'programmatic'
      AND id != master_skin_id
      AND id NOT IN (SELECT DISTINCT skin_id FROM public.sheep WHERE skin_id IS NOT NULL);

END $$;
