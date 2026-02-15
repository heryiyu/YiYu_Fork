-- Update the '出發去大福' schedule to notify 2 minutes from now
-- This moves it from the "past (ignored)" window into the "current (active)" window
-- So the notification system should pick it up immediately.

UPDATE public.schedules
SET notify_at = NOW() + interval '2 minutes',
    is_notified = FALSE
WHERE action = '出發去大福';  -- Using the title from your screenshot

-- Verify the update
SELECT id, action, notify_at, is_notified 
FROM public.schedules 
WHERE action = '出發去大福';
