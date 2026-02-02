-- Originally: migration_v16_add_unique_constraint.sql
-- Part of migration chain. See MIGRATIONS.md for full index.

-- MIGRATION V16: Add UNIQUE Constraint to line_id
-- This allows us to use 'UPSERT' (Insert or Update) logic safely, just like with Sheep.

DO $$
BEGIN
    DELETE FROM public.users
    WHERE ctid IN (
        SELECT ctid FROM (
            SELECT ctid,
            ROW_NUMBER() OVER (partition BY line_id ORDER BY last_login DESC NULLS LAST) AS rnum
            FROM public.users
        ) t
        WHERE t.rnum > 1
    );

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_line_id_key'
    ) THEN
        ALTER TABLE public.users ADD CONSTRAINT users_line_id_key UNIQUE (line_id);
    END IF;

    GRANT ALL ON TABLE public.users TO anon;
    GRANT ALL ON TABLE public.users TO authenticated;
    GRANT ALL ON TABLE public.users TO service_role;

END $$;
