-- Migration: Add Foreign Key to spiritual_plans
-- Created at: 2026-02-04
-- Reason: To allow join queries with sheep table for notifications

DO $$
BEGIN
    -- 1. Ensure sheep_id is UUID (if it was text)
    -- First, check if column needs casting
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'spiritual_plans' AND column_name = 'sheep_id' AND data_type = 'text'
    ) THEN
        ALTER TABLE public.spiritual_plans 
        ALTER COLUMN sheep_id TYPE UUID USING sheep_id::UUID;
    END IF;

    -- 2. Add Foreign Key Constraint
    IF NOT EXISTS (
        SELECT FROM information_schema.table_constraints 
        WHERE table_name = 'spiritual_plans' AND constraint_name = 'spiritual_plans_sheep_id_fkey'
    ) THEN
        ALTER TABLE public.spiritual_plans
        ADD CONSTRAINT spiritual_plans_sheep_id_fkey
        FOREIGN KEY (sheep_id) REFERENCES public.sheep(id)
        ON DELETE CASCADE;
    END IF;
END $$;
