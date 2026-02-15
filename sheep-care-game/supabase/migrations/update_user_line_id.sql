-- ⚠️ WARNING: This is for testing purposes.
-- Replace 'YOUR_ACTUAL_LINE_USER_ID' with your real Line User ID.
-- You can find this usually in the LINE Developers Console or by logging the ID from a webhook event.
-- If you don't know it, you might need to re-login via LINE in your app to trigger the profile update.

UPDATE public.users
SET line_id = 'YOUR_ACTUAL_LINE_USER_ID'
WHERE id = (
    SELECT created_by 
    FROM public.schedules 
    WHERE action = '出發去大福' 
    LIMIT 1
);
