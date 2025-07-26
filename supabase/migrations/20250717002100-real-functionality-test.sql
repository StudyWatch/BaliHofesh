-- Emergency verification and test of ALL critical tables and functionality
-- This migration will test and verify actual functionality

-- First, let's verify what actually exists in study_partners table
DO $$
BEGIN
    -- Check if contact_info column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'study_partners' 
        AND column_name = 'contact_info'
    ) THEN
        ALTER TABLE public.study_partners ADD COLUMN contact_info TEXT;
        RAISE NOTICE 'Added contact_info column to study_partners';
    END IF;

    -- Check if preferred_times column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'study_partners' 
        AND column_name = 'preferred_times'
    ) THEN
        ALTER TABLE public.study_partners ADD COLUMN preferred_times TEXT[] DEFAULT '{}';
        RAISE NOTICE 'Added preferred_times column to study_partners';
    END IF;
END $$;

-- Ensure shared_sessions table exists with correct structure
CREATE TABLE IF NOT EXISTS public.shared_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    meeting_link TEXT NOT NULL,
    platform TEXT DEFAULT 'zoom',
    scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    max_participants INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    notification_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Ensure user_course_progress has favorite fields
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_course_progress' 
        AND column_name = 'is_favorite'
    ) THEN
        ALTER TABLE public.user_course_progress ADD COLUMN is_favorite BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added is_favorite column to user_course_progress';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_course_progress' 
        AND column_name = 'semester'
    ) THEN
        ALTER TABLE public.user_course_progress ADD COLUMN semester TEXT;
        RAISE NOTICE 'Added semester column to user_course_progress';
    END IF;
END $$;

-- Test INSERT functionality for study_partners
INSERT INTO public.study_partners (
    user_id,
    course_id, 
    description,
    available_hours,
    preferred_times,
    contact_info,
    expires_at
) VALUES (
    'e47849e4-962f-43d2-8f3a-d7816a3f7d1f', -- Test user ID from logs
    '66e2cb03-fdd9-4674-b859-b5ecee7d9dd7', -- Test course ID from logs
    'Test study partner request',
    ARRAY['ראשון 10:00-12:00'],
    ARRAY['ראשון 10:00-12:00'],
    'test@example.com',
    now() + INTERVAL '3 days'
) ON CONFLICT DO NOTHING;

-- Test INSERT functionality for user_course_progress 
INSERT INTO public.user_course_progress (
    user_id,
    course_id,
    status,
    progress_percentage,
    is_favorite,
    semester
) VALUES (
    'e47849e4-962f-43d2-8f3a-d7816a3f7d1f',
    '66e2cb03-fdd9-4674-b859-b5ecee7d9dd7',
    'active',
    0,
    true,
    'semester_a'
) ON CONFLICT (user_id, course_id) DO UPDATE SET
    is_favorite = EXCLUDED.is_favorite,
    semester = EXCLUDED.semester,
    updated_at = now();

-- Enable RLS and create proper policies
ALTER TABLE public.study_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_sessions ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies and recreate them properly
DROP POLICY IF EXISTS "Anyone can view active study partners" ON public.study_partners;
DROP POLICY IF EXISTS "Users can manage their own study partner requests" ON public.study_partners;
DROP POLICY IF EXISTS "Admins can manage all study partner requests" ON public.study_partners;

-- New comprehensive policies for study_partners
CREATE POLICY "study_partners_select_policy" ON public.study_partners
    FOR SELECT USING (expires_at > now());

CREATE POLICY "study_partners_insert_policy" ON public.study_partners
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    );

CREATE POLICY "study_partners_update_policy" ON public.study_partners
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    );

CREATE POLICY "study_partners_delete_policy" ON public.study_partners
    FOR DELETE USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    );

-- Policies for shared_sessions
DROP POLICY IF EXISTS "Anyone can view active shared sessions" ON public.shared_sessions;
DROP POLICY IF EXISTS "Users can manage their own shared sessions" ON public.shared_sessions;
DROP POLICY IF EXISTS "Admins can manage all shared sessions" ON public.shared_sessions;

CREATE POLICY "shared_sessions_select_policy" ON public.shared_sessions
    FOR SELECT USING (is_active = true);

CREATE POLICY "shared_sessions_insert_policy" ON public.shared_sessions
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    );

CREATE POLICY "shared_sessions_update_policy" ON public.shared_sessions
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    );

CREATE POLICY "shared_sessions_delete_policy" ON public.shared_sessions
    FOR DELETE USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    );

-- Policies for user_course_progress
DROP POLICY IF EXISTS "Users can manage their own course progress" ON public.user_course_progress;
DROP POLICY IF EXISTS "Admins can manage all course progress" ON public.user_course_progress;

CREATE POLICY "user_course_progress_policy" ON public.user_course_progress
    FOR ALL USING (
        auth.uid() = user_id OR 
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    );

-- Create verification function to test functionality
CREATE OR REPLACE FUNCTION public.test_functionality()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    test_user_id UUID := 'e47849e4-962f-43d2-8f3a-d7816a3f7d1f';
    test_course_id UUID := '66e2cb03-fdd9-4674-b859-b5ecee7d9dd7';
    partners_count INTEGER;
    sessions_count INTEGER;
    progress_count INTEGER;
BEGIN
    -- Count records in each table
    SELECT COUNT(*) INTO partners_count FROM public.study_partners 
    WHERE user_id = test_user_id AND course_id = test_course_id;
    
    SELECT COUNT(*) INTO sessions_count FROM public.shared_sessions 
    WHERE user_id = test_user_id AND course_id = test_course_id;
    
    SELECT COUNT(*) INTO progress_count FROM public.user_course_progress 
    WHERE user_id = test_user_id AND course_id = test_course_id;

    result := json_build_object(
        'study_partners_count', partners_count,
        'shared_sessions_count', sessions_count,
        'user_course_progress_count', progress_count,
        'test_user_id', test_user_id,
        'test_course_id', test_course_id,
        'timestamp', now()
    );

    RETURN result;
END;
$$;