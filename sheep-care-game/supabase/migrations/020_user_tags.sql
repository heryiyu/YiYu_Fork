-- Migration: User-Managed Tags for Sheep
-- Created at: 2026-02-05
-- Feature: Per-user tags with ordered assignments per sheep

-- 1. Create sheep_tags table
CREATE TABLE IF NOT EXISTS public.sheep_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#6b7280',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sheep_tags_user_id ON public.sheep_tags (user_id);

-- 2. Create sheep_tag_assignments join table
CREATE TABLE IF NOT EXISTS public.sheep_tag_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sheep_id UUID NOT NULL REFERENCES public.sheep(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.sheep_tags(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (sheep_id, tag_id),
    UNIQUE (sheep_id, order_index)
);

CREATE INDEX IF NOT EXISTS idx_sheep_tag_assignments_sheep_id ON public.sheep_tag_assignments (sheep_id);
CREATE INDEX IF NOT EXISTS idx_sheep_tag_assignments_tag_id ON public.sheep_tag_assignments (tag_id);
CREATE INDEX IF NOT EXISTS idx_sheep_tag_assignments_user_id ON public.sheep_tag_assignments (user_id);

-- 3. Enable RLS
ALTER TABLE public.sheep_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sheep_tag_assignments ENABLE ROW LEVEL SECURITY;

-- 4. Policies (Public access for LINE auth, matching app pattern)
DROP POLICY IF EXISTS "Public access for app" ON public.sheep_tags;
CREATE POLICY "Public access for app" ON public.sheep_tags
FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for app" ON public.sheep_tag_assignments;
CREATE POLICY "Public access for app" ON public.sheep_tag_assignments
FOR ALL USING (true) WITH CHECK (true);

-- 5. Comments
COMMENT ON TABLE public.sheep_tags IS 'User-defined tags for categorizing sheep (e.g. 新朋友, 夥伴)';
COMMENT ON TABLE public.sheep_tag_assignments IS 'Ordered tag assignments per sheep; first tag is shown on cards';
