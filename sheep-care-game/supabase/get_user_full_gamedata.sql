-- Get User Full Game Data RPC
-- This function batches 4 queries into 1 to optimize login loading times.
-- Run this in your Supabase SQL Editor.

CREATE OR REPLACE FUNCTION get_user_full_gamedata(p_line_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user RECORD;
    v_sheep JSONB;
    v_tags JSONB;
    v_assignments JSONB;
    v_result JSONB;
BEGIN
    -- 1. Fetch User Profile
    SELECT * INTO v_user
    FROM users
    WHERE line_id = p_line_id;

    -- If user doesn't exist, return a specific structure indicating a new user
    IF v_user IS NULL THEN
        RETURN jsonb_build_object(
            'isNewUser', true
        );
    END IF;

    -- 2. Fetch all Sheep for this user
    SELECT COALESCE(jsonb_agg(row_to_json(s)), '[]'::jsonb) INTO v_sheep
    FROM (
        SELECT *
        FROM sheep
        WHERE user_id = v_user.id
    ) s;

    -- 3. Fetch all custom Tags for this user
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_tags
    FROM (
        SELECT *
        FROM sheep_tags
        WHERE user_id = p_line_id
        ORDER BY created_at ASC
    ) t;

    -- 4. Fetch all Tag Assignments for this user
    SELECT COALESCE(jsonb_agg(row_to_json(a)), '[]'::jsonb) INTO v_assignments
    FROM (
        SELECT sheep_id, tag_id, order_index
        FROM sheep_tag_assignments
        WHERE user_id = p_line_id
        ORDER BY order_index ASC
    ) a;

    -- 5. Construct and return the combined JSON object
    v_result := jsonb_build_object(
        'isNewUser', false,
        'user', row_to_json(v_user),
        'sheep', v_sheep,
        'tags', v_tags,
        'assignments', v_assignments
    );

    RETURN v_result;
END;
$$;
