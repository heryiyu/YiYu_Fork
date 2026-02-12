-- Add completion tracking columns
ALTER TABLE spiritual_plans ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE spiritual_plans ADD COLUMN IF NOT EXISTS feedback JSONB DEFAULT '{}'::jsonb;
