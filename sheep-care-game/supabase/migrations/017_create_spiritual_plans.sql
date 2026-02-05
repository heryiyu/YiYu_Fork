-- Migration: Create spiritual_plans table to support Notification System
-- Created at: 2026-02-03
-- Feature: Spiritual Planning & Push Notifications

-- 1. Create spiritual_plans table
CREATE TABLE IF NOT EXISTS public.spiritual_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL, 
    sheep_id TEXT NOT NULL, 
    action TEXT NOT NULL,
    
    -- Scheduled Time: Nullable. 
    -- If NULL -> General Todo (No Notification)
    -- If timestamp -> Notification scheduled
    scheduled_time TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    
    location TEXT DEFAULT '',
    content TEXT DEFAULT '',
    is_notified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Indexes for performance
-- Index for finding un-notified plans near a specific time
CREATE INDEX IF NOT EXISTS idx_spiritual_plans_scheduled_time 
ON public.spiritual_plans (scheduled_time) 
WHERE is_notified = FALSE;

CREATE INDEX IF NOT EXISTS idx_spiritual_plans_user_id 
ON public.spiritual_plans (user_id);

CREATE INDEX IF NOT EXISTS idx_spiritual_plans_sheep_id 
ON public.spiritual_plans (sheep_id);

-- 3. Enable RLS
ALTER TABLE public.spiritual_plans ENABLE ROW LEVEL SECURITY;

-- 4. Create Policy (Open for now, matching app pattern)
DROP POLICY IF EXISTS "Public access for app" ON public.spiritual_plans;
CREATE POLICY "Public access for app" ON public.spiritual_plans
FOR ALL
USING (true)
WITH CHECK (true);

-- 5. Comments
COMMENT ON TABLE public.spiritual_plans IS 'Stores scheduled spiritual actions for sheep, used for push notifications';
COMMENT ON COLUMN public.spiritual_plans.scheduled_time IS 'Timestamp for notification. If NULL, acts as a general to-do item without reminder.';
