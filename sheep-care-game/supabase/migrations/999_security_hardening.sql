-- 🛡️ [安全性加固] Supabase RLS 強化腳本 v2.5 (Shadow Auth 最終版)
-- 加入了更徹底的清理邏輯，確保不會發生「Policy already exists」報錯

-- 1. 地毯式清除所有可能的舊政策名稱
DO $$ 
BEGIN
    -- 清除 Users 表的所有舊政策
    DROP POLICY IF EXISTS "Public access" ON public.users;
    DROP POLICY IF EXISTS "Enable access for all (No Auth)" ON public.users;
    DROP POLICY IF EXISTS "Users can manage own profile" ON public.users;
    DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
    DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
    
    -- 清除 Sheep 表的所有舊政策
    DROP POLICY IF EXISTS "Public access" ON public.sheep;
    DROP POLICY IF EXISTS "Enable all access for now" ON public.sheep;
    DROP POLICY IF EXISTS "Enable access for all (No Auth)" ON public.sheep;
    DROP POLICY IF EXISTS "Users can manage own sheep" ON public.sheep;
    
    -- 清除 Schedules 表的所有舊政策
    DROP POLICY IF EXISTS "Public access" ON public.schedules;
    DROP POLICY IF EXISTS "Enable access for all users" ON public.schedules;
    DROP POLICY IF EXISTS "Enable access for all (No Auth)" ON public.schedules;
    DROP POLICY IF EXISTS "Users can manage own schedules" ON public.schedules;
    
    -- 清除 Participants 表的所有舊政策
    DROP POLICY IF EXISTS "Public access" ON public.schedule_participants;
    DROP POLICY IF EXISTS "Enable access for all users" ON public.schedule_participants;
    DROP POLICY IF EXISTS "Enable access for all (No Auth)" ON public.schedule_participants;
    DROP POLICY IF EXISTS "Users can manage own participations" ON public.schedule_participants;

    -- 清除 Tags 表的所有舊政策
    DROP POLICY IF EXISTS "Public access" ON public.sheep_tags;
    DROP POLICY IF EXISTS "Users can manage own tags" ON public.sheep_tags;
    DROP POLICY IF EXISTS "Public access" ON public.sheep_tag_assignments;
    DROP POLICY IF EXISTS "Users can manage own tag assignments" ON public.sheep_tag_assignments;
END $$;

-- 2. 確保 RLS 已啟用
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sheep ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sheep_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sheep_tag_assignments ENABLE ROW LEVEL SECURITY;

-- 3. 建立影子帳號專用政策 (對齊背景登入機制)
CREATE POLICY "Users can manage own profile" ON public.users FOR ALL 
USING (line_id = auth.jwt()->>'email' OR (line_id || '@line.shadow') = auth.jwt()->>'email');

CREATE POLICY "Users can manage own sheep" ON public.sheep FOR ALL 
USING (user_id IN (SELECT id FROM public.users WHERE (line_id || '@line.shadow') = auth.jwt()->>'email'));

CREATE POLICY "Users can manage own schedules" ON public.schedules FOR ALL 
USING (created_by IN (SELECT id FROM public.users WHERE (line_id || '@line.shadow') = auth.jwt()->>'email'));

CREATE POLICY "Users can manage own participations" ON public.schedule_participants FOR ALL 
USING (
  schedule_id IN (SELECT id FROM public.schedules WHERE created_by IN (SELECT id FROM public.users WHERE (line_id || '@line.shadow') = auth.jwt()->>'email'))
);

CREATE POLICY "Users can manage own tags" ON public.sheep_tags FOR ALL 
USING (user_id || '@line.shadow' = auth.jwt()->>'email');

CREATE POLICY "Users can manage own tag assignments" ON public.sheep_tag_assignments FOR ALL 
USING (user_id || '@line.shadow' = auth.jwt()->>'email');
