-- Fix user_course_progress table to ensure required columns exist
-- This migration ensures all necessary columns for favorites and semester system

-- First check and add is_favorite column if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_course_progress' 
        AND column_name = 'is_favorite'
    ) THEN
        ALTER TABLE public.user_course_progress ADD COLUMN is_favorite BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added is_favorite column to user_course_progress';
    ELSE
        RAISE NOTICE 'is_favorite column already exists in user_course_progress';
    END IF;
END $$;

-- Check and add semester column if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_course_progress' 
        AND column_name = 'semester'
    ) THEN
        ALTER TABLE public.user_course_progress ADD COLUMN semester TEXT;
        RAISE NOTICE 'Added semester column to user_course_progress';
    ELSE
        RAISE NOTICE 'semester column already exists in user_course_progress';
    END IF;
END $$;

-- Ensure the table has all necessary columns for current functionality
ALTER TABLE public.user_course_progress 
ADD COLUMN IF NOT EXISTS last_activity TIMESTAMPTZ DEFAULT NOW();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_course_progress_user_favorite 
ON public.user_course_progress(user_id, is_favorite) 
WHERE is_favorite = true;

CREATE INDEX IF NOT EXISTS idx_user_course_progress_user_course 
ON public.user_course_progress(user_id, course_id);

CREATE INDEX IF NOT EXISTS idx_user_course_progress_semester 
ON public.user_course_progress(semester);

-- Create or update the handle_course_favorite function
CREATE OR REPLACE FUNCTION public.handle_course_favorite(
    p_course_id UUID,
    p_is_favorite BOOLEAN DEFAULT true,
    p_semester TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_existing_id UUID;
    v_result JSONB;
BEGIN
    -- Get current user
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    -- Check if record exists
    SELECT id INTO v_existing_id 
    FROM user_course_progress 
    WHERE user_id = v_user_id AND course_id = p_course_id;

    IF v_existing_id IS NOT NULL THEN
        -- Update existing record
        UPDATE user_course_progress 
        SET 
            is_favorite = p_is_favorite,
            semester = COALESCE(p_semester, semester),
            updated_at = NOW()
        WHERE id = v_existing_id;
        
        v_result := jsonb_build_object(
            'success', true,
            'action', 'updated',
            'id', v_existing_id
        );
    ELSE
        -- Insert new record
        INSERT INTO user_course_progress (
            user_id,
            course_id,
            status,
            progress_percentage,
            is_favorite,
            semester
        ) VALUES (
            v_user_id,
            p_course_id,
            'active',
            0,
            p_is_favorite,
            p_semester
        ) RETURNING id INTO v_existing_id;
        
        v_result := jsonb_build_object(
            'success', true,
            'action', 'created',
            'id', v_existing_id
        );
    END IF;

    RETURN v_result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.handle_course_favorite TO authenticated;

-- Ensure RLS policies are properly set
DROP POLICY IF EXISTS "user_course_progress_policy" ON public.user_course_progress;

CREATE POLICY "user_course_progress_select_policy" ON public.user_course_progress
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "user_course_progress_insert_policy" ON public.user_course_progress
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_course_progress_update_policy" ON public.user_course_progress
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_course_progress_delete_policy" ON public.user_course_progress
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- Add admin policy for management
CREATE POLICY "user_course_progress_admin_policy" ON public.user_course_progress
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );