# Supabase Migrations Index

Run migrations in numeric order in Supabase SQL Editor. Production schema may differ from early migrations (e.g. uses `line_id`, `name`, `avatar` instead of `line_user_id`, `display_name`).

## Migration Order

| # | File | Tables | Purpose |
|---|------|--------|---------|
| 001 | supabase/migrations/001_initial.sql | users, sheep | Base schema, line_user_id, display_name, coins |
| 002 | supabase/migrations/002_line_integration.sql | users, sheep | line_user_id, coins; sheep owner_id to user_id |
| 003 | supabase/migrations/003_type_fix.sql | users, sheep | Same as V2; owner_id copy with cast |
| 004 | supabase/migrations/004_rls_type_fix.sql | users, sheep | RLS auth.uid() casting |
| 005 | supabase/migrations/005_cleanup_line_id.sql | users, sheep | Drop line_user_id; sheep user_id as TEXT |
| 006 | supabase/migrations/006_sheep_columns.sql | sheep | x, y, care_level, skin_id, etc. |
| 007 | supabase/migrations/007_backfill_data.sql | sheep | skin_id TEXT; randomize positions; backfill |
| 008 | supabase/migrations/008_sheep_skins_table.sql | sheep, sheep_skins | Create sheep_skins; migrate visual_data |
| 009 | supabase/migrations/009_repair_skin_links.sql | sheep, sheep_skins | Fix broken skin_id references |
| 010 | supabase/migrations/010_emergency_regen_skins.sql | sheep, sheep_skins | Regenerate skins when visual_data gone |
| 011 | supabase/migrations/011_transfer_to_admin.sql | sheep | One-time: move all sheep to admin |
| 012 | supabase/migrations/012_restore_skin_fk.sql | sheep | skin_id UUID + FK to sheep_skins |
| 013 | supabase/migrations/013_parametric_skins.sql | sheep, sheep_skins | visual_attrs; Standard Sheep Template |
| 014 | supabase/migrations/014_rls_public_access.sql | users, sheep, sheep_skins | Public access policies for LINE |
| 015 | supabase/migrations/015_users_game_data.sql | users | Add game_data; reset RLS |
| 016 | supabase/migrations/016_unique_line_id.sql | users | UNIQUE(line_id) for upsert |

## Production Schema (Current)

**users**: line_id (PK), name, nickname, avatar, game_data, last_login, coins, created_at

**sheep**: id, user_id, name, status, health, care_level, type, Spiritual_Journey_Planning (visual_attrs), skin_id, x, y, angle, direction, etc.

**sheep_skins**: id, name, type, data, created_at

## Utility Scripts

| Category | Path | Purpose |
|----------|------|---------|
| Check | supabase/scripts/check/users_schema.sql | Inspect users table columns |
| Check | supabase/scripts/check/skins_columns.sql | Inspect sheep_skins columns |
| Check | supabase/scripts/check/settings_save.sql | Verify game_data is saving |
| Check | supabase/scripts/check/rls.sql | Inspect RLS policies |
| Debug | supabase/scripts/debug/migration_status.sql | Migration state and skin counts |
| Debug | supabase/scripts/debug/sheep_ownership.sql | Diagnose "0 Sheep" loading |
| Fix | supabase/scripts/fix/admin_permissions.sql | Admin RLS bypass for localhost |
| Inspect | supabase/scripts/inspect/users.sql | Sample users row |

## Reference

- **supabase/schema.sql**: Reference schema (may not match production after migrations)
