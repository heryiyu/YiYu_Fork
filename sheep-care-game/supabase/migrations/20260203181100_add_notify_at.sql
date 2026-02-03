-- Migration: Add notify_at column for flexible reminders
-- Created at: 2026-02-03

-- 1. Add Columns
ALTER TABLE public.spiritual_plans 
ADD COLUMN IF NOT EXISTS notify_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS reminder_offset INTEGER DEFAULT 0;

-- 2. Backfill existing data
-- Existing plans assume "On Time" notification, so notify_at = scheduled_time
UPDATE public.spiritual_plans 
SET notify_at = scheduled_time 
WHERE notify_at IS NULL AND scheduled_time IS NOT NULL;

-- 3. Index Update
-- Drop old index on scheduled_time if it exists (optional, or keep for sorting)
DROP INDEX IF EXISTS idx_spiritual_plans_scheduled_time;

-- Create new index on notify_at for the cron job
CREATE INDEX IF NOT EXISTS idx_spiritual_plans_notify_at 
ON public.spiritual_plans (notify_at) 
WHERE is_notified = FALSE;

-- 4. Comments
COMMENT ON COLUMN public.spiritual_plans.notify_at IS 'The actual time the notification should be sent. Calculated as scheduled_time - offset.';
COMMENT ON COLUMN public.spiritual_plans.reminder_offset IS 'Minutes to remind before the event. -1 indicates No Reminder.';
