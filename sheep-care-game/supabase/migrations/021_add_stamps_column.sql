-- Add stamps column to sheep table
ALTER TABLE public.sheep
ADD COLUMN IF NOT EXISTS stamps JSONB DEFAULT '{}'::JSONB;

COMMENT ON COLUMN public.sheep.stamps IS 'Stores the achievement stamps for the sheep. Keys are stamp IDs, values are boolean.';
