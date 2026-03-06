-- Migration V24: Cleanup Redundant Columns and Tables
-- This script safely merges deprecated JSONB fields into the new `sheep_data` field,
-- and then drops the old columns. It also removes deprecated columns from `users`
-- and completely drops the unused `spiritual_plans` table.

DO $$ 
DECLARE
    has_visual BOOLEAN := EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sheep' AND column_name = 'visual');
    has_visual_attrs BOOLEAN := EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sheep' AND column_name = 'visual_attrs');
    has_journey BOOLEAN := EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sheep' AND column_name = 'Spiritual_Journey_Planning');
BEGIN
    -- 1. Ensure `sheep_data` exists on `sheep` table
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sheep' AND column_name = 'sheep_data') THEN
        ALTER TABLE public.sheep ADD COLUMN sheep_data JSONB DEFAULT '{}'::jsonb;
    END IF;

    -- 2. Dynamically merge deprecated columns into `sheep_data` 
    -- The `||` operator merges JSONB. The right side overwrites the left side, 
    -- so we put `sheep_data` on the right to preserve the most recent data if any exists.
    IF has_visual THEN
        EXECUTE 'UPDATE public.sheep SET sheep_data = coalesce(visual, ''{}''::jsonb) || coalesce(sheep_data, ''{}''::jsonb) WHERE visual IS NOT NULL';
        EXECUTE 'ALTER TABLE public.sheep DROP COLUMN visual';
    END IF;

    IF has_visual_attrs THEN
        EXECUTE 'UPDATE public.sheep SET sheep_data = coalesce(visual_attrs, ''{}''::jsonb) || coalesce(sheep_data, ''{}''::jsonb) WHERE visual_attrs IS NOT NULL';
        EXECUTE 'ALTER TABLE public.sheep DROP COLUMN visual_attrs';
    END IF;

    IF has_journey THEN
        EXECUTE 'UPDATE public.sheep SET sheep_data = coalesce("Spiritual_Journey_Planning", ''{}''::jsonb) || coalesce(sheep_data, ''{}''::jsonb) WHERE "Spiritual_Journey_Planning" IS NOT NULL';
        EXECUTE 'ALTER TABLE public.sheep DROP COLUMN "Spiritual_Journey_Planning"';
    END IF;
    
    -- 3. Cleanup redundant columns in `users` table
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'line_user_id') THEN
        ALTER TABLE public.users DROP COLUMN line_user_id;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'display_name') THEN
        ALTER TABLE public.users DROP COLUMN display_name;
    END IF;

    -- 4. Drop obsolete tables
    DROP TABLE IF EXISTS public.spiritual_plans CASCADE;

END $$;
