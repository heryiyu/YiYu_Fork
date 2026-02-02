-- Originally: migration_v13_parametric_skins.sql
-- Part of migration chain. See MIGRATIONS.md for full index.

-- MIGRATION V13: Parametric Skins Architecture
-- Goal: Debloat sheep_skins by moving attributes (color, accessories) to sheep.visual_attrs
-- Preserves 'image' skins as valid independent skins.

DO $$
DECLARE
    master_skin_id uuid;
    count_moved int;
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'sheep' AND column_name = 'visual_attrs') THEN
        ALTER TABLE public.sheep ADD COLUMN visual_attrs jsonb DEFAULT '{}'::jsonb;
    END IF;

    SELECT id INTO master_skin_id FROM public.sheep_skins 
    WHERE name = 'Standard Sheep Template' AND type = 'programmatic' LIMIT 1;

    IF master_skin_id IS NULL THEN
        INSERT INTO public.sheep_skins (name, type, data)
        VALUES ('Standard Sheep Template', 'programmatic', '{}'::jsonb)
        RETURNING id INTO master_skin_id;
    END IF;

    RAISE NOTICE 'Master Skin ID: %', master_skin_id;

    WITH moved_rows AS (
        UPDATE public.sheep s
        SET 
            visual_attrs = ss.data,
            skin_id = master_skin_id
        FROM public.sheep_skins ss
        WHERE s.skin_id = ss.id 
          AND ss.type = 'programmatic'
          AND ss.id != master_skin_id
        RETURNING s.id
    )
    SELECT count(*) INTO count_moved FROM moved_rows;

    RAISE NOTICE 'Migrated % sheep to Parametric Architecture.', count_moved;

    DELETE FROM public.sheep_skins
    WHERE type = 'programmatic'
      AND id != master_skin_id
      AND id NOT IN (SELECT DISTINCT skin_id FROM public.sheep WHERE skin_id IS NOT NULL);

END $$;
