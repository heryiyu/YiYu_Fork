-- 🛡️ [安全性加固] Supabase RLS 強化腳本 v2.3
-- 加入了更全面的清理邏輯，避免「Policy already exists」報錯

-- 1. 使用者資料 (users)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access" ON public.users;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can manage own profile" ON public.users;

CREATE POLICY "Users can manage own profile" 
ON public.users 
FOR ALL 
USING (
  id = auth.uid() 
  OR line_id = auth.uid()::text
);

-- 2. 小羊資料 (sheep)
ALTER TABLE public.sheep ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for now" ON public.sheep;
DROP POLICY IF EXISTS "Users can view their own sheep" ON public.sheep;
DROP POLICY IF EXISTS "Users can insert their own sheep" ON public.sheep;
DROP POLICY IF EXISTS "Users can update their own sheep" ON public.sheep;
DROP POLICY IF EXISTS "Users can delete their own sheep" ON public.sheep;
DROP POLICY IF EXISTS "Users can manage own sheep" ON public.sheep;

CREATE POLICY "Users can manage own sheep" 
ON public.sheep 
FOR ALL 
USING (user_id = auth.uid());

-- 3. 行程表 (schedules)
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable access for all users" ON public.schedules;
DROP POLICY IF EXISTS "Public access" ON public.schedules;
DROP POLICY IF EXISTS "Users can view their own schedules" ON public.schedules;
DROP POLICY IF EXISTS "Users can manage own schedules" ON public.schedules;

CREATE POLICY "Users can manage own schedules" 
ON public.schedules 
FOR ALL 
USING (created_by = auth.uid());

-- 4. 參與紀錄 (schedule_participants)
ALTER TABLE public.schedule_participants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable access for all users" ON public.schedule_participants;
DROP POLICY IF EXISTS "Users can manage own participations" ON public.schedule_participants;

CREATE POLICY "Users can manage own participations" 
ON public.schedule_participants 
FOR ALL 
USING (
  schedule_id IN (SELECT s.id FROM public.schedules s WHERE s.created_by = auth.uid()) OR
  sheep_id IN (SELECT sh.id FROM public.sheep sh WHERE sh.user_id = auth.uid())
);

-- 5. 標籤與指派 (sheep_tags & assignments)
ALTER TABLE public.sheep_tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access for app" ON public.sheep_tags;
DROP POLICY IF EXISTS "Users can manage own tags" ON public.sheep_tags;
CREATE POLICY "Users can manage own tags" 
ON public.sheep_tags 
FOR ALL 
USING (user_id = auth.uid()::text);

ALTER TABLE public.sheep_tag_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access for app" ON public.sheep_tag_assignments;
DROP POLICY IF EXISTS "Users can manage own tag assignments" ON public.sheep_tag_assignments;
CREATE POLICY "Users can manage own tag assignments" 
ON public.sheep_tag_assignments 
FOR ALL 
USING (user_id = auth.uid()::text);
