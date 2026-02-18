-- 🛡️ [安全性加固] Supabase RLS 強化腳本 v2.7 (Case-Insensitive & Mobile Fix)
-- 修正了 Supabase Auth 自動將 Email 轉為小寫而導致的 RLS 判定失效問題

-- 1. 地毯式清除所有舊政策
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can manage own profile" ON public.users;
    DROP POLICY IF EXISTS "Users can manage own sheep" ON public.sheep;
    DROP POLICY IF EXISTS "Users can manage own schedules" ON public.schedules;
    DROP POLICY IF EXISTS "Users can manage own participations" ON public.schedule_participants;
    DROP POLICY IF EXISTS "Users can manage own tags" ON public.sheep_tags;
    DROP POLICY IF EXISTS "Users can manage own tag assignments" ON public.sheep_tag_assignments;
END $$;

-- 2. 建立影子帳號專用政策 (強化版：加入 LOWER 處理)

-- Users 表：允許讀取與背景自動註冊 (Insert)
-- 使用 LOWER(line_id) 來確保與 Supabase Auth 的小寫 Email 匹配
CREATE POLICY "Users can manage own profile" ON public.users FOR ALL 
USING (LOWER(line_id || '@line.shadow') = auth.jwt()->>'email')
WITH CHECK (LOWER(line_id || '@line.shadow') = auth.jwt()->>'email');

-- Sheep 表：允許管理自己的小羊
CREATE POLICY "Users can manage own sheep" ON public.sheep FOR ALL 
USING (user_id IN (SELECT id FROM public.users WHERE LOWER(line_id || '@line.shadow') = auth.jwt()->>'email'))
WITH CHECK (user_id IN (SELECT id FROM public.users WHERE LOWER(line_id || '@line.shadow') = auth.jwt()->>'email'));

-- Schedules 表：允許管理自己的規劃
CREATE POLICY "Users can manage own schedules" ON public.schedules FOR ALL 
USING (created_by IN (SELECT id FROM public.users WHERE LOWER(line_id || '@line.shadow') = auth.jwt()->>'email'))
WITH CHECK (created_by IN (SELECT id FROM public.users WHERE LOWER(line_id || '@line.shadow') = auth.jwt()->>'email'));

-- Participations 表：允許管理自己或自己小羊的參與紀錄
CREATE POLICY "Users can manage own participations" ON public.schedule_participants FOR ALL 
USING (
  schedule_id IN (SELECT id FROM public.schedules WHERE created_by IN (SELECT id FROM public.users WHERE LOWER(line_id || '@line.shadow') = auth.jwt()->>'email')) OR
  sheep_id IN (SELECT id FROM public.sheep WHERE user_id IN (SELECT id FROM public.users WHERE LOWER(line_id || '@line.shadow') = auth.jwt()->>'email'))
);

-- Tags 表
CREATE POLICY "Users can manage own tags" ON public.sheep_tags FOR ALL 
USING (LOWER(user_id || '@line.shadow') = auth.jwt()->>'email')
WITH CHECK (LOWER(user_id || '@line.shadow') = auth.jwt()->>'email');

CREATE POLICY "Users can manage own tag assignments" ON public.sheep_tag_assignments FOR ALL 
USING (LOWER(user_id || '@line.shadow') = auth.jwt()->>'email')
WITH CHECK (LOWER(user_id || '@line.shadow') = auth.jwt()->>'email');
