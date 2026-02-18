-- 🛡️ [修正版] Supabase RLS 加固腳本
-- 解決 "operator does not exist: uuid = text" 錯誤

-- 1. 加固使用者清單 (users table)
DROP POLICY IF EXISTS "Public access" ON public.users;
DROP POLICY IF EXISTS "Users can only manage their own profile" ON public.users;

CREATE POLICY "Users can only manage their own profile" 
ON public.users 
FOR ALL 
USING (
    id = auth.uid() -- UUID = UUID (Supabase $auth.uid)
    OR line_id = auth.uid()::text -- TEXT = TEXT
);


-- 2. 加固小羊資料 (sheep table)
DROP POLICY IF EXISTS "Enable all access for now" ON public.sheep;
DROP POLICY IF EXISTS "Users can only manage their own sheep" ON public.sheep;

CREATE POLICY "Users can only manage their own sheep" 
ON public.sheep 
FOR ALL 
USING (
    user_id = auth.uid() -- UUID = UUID
);


-- 3. 加固行程表 (schedules table)
-- 如果您的表名是 schedules 且欄位是 created_by
DROP POLICY IF EXISTS "Enable access for all users" ON public.schedules;
DROP POLICY IF EXISTS "Users can only manage their own schedules" ON public.schedules;

CREATE POLICY "Users can only manage their own schedules" 
ON public.schedules 
FOR ALL 
USING (
    created_by = auth.uid() -- UUID = UUID
);


-- 4. 加固靈修計畫 (spiritual_plans table) - 欄位是 TEXT
DROP POLICY IF EXISTS "Public access for app" ON public.spiritual_plans;
DROP POLICY IF EXISTS "Users can only manage their own spiritual plans" ON public.spiritual_plans;

CREATE POLICY "Users can only manage their own spiritual plans" 
ON public.spiritual_plans 
FOR ALL 
USING (
    user_id = auth.uid()::text -- TEXT = TEXT
);


-- 5. 加固標籤 (sheep_tags & assignments) - 欄位是 TEXT
DROP POLICY IF EXISTS "Public access for app" ON public.sheep_tags;
CREATE POLICY "Users can only manage their own tags" 
ON public.sheep_tags 
FOR ALL 
USING (
    user_id = auth.uid()::text -- TEXT = TEXT
);

DROP POLICY IF EXISTS "Public access for app" ON public.sheep_tag_assignments;
CREATE POLICY "Users can only manage their own tag assignments" 
ON public.sheep_tag_assignments 
FOR ALL 
USING (
    user_id = auth.uid()::text -- TEXT = TEXT
);
