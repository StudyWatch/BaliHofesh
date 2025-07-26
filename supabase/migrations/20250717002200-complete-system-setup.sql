-- ==========================================
-- Complete System Setup - All Critical Tables
-- ==========================================

-- Create study_partners table
CREATE TABLE IF NOT EXISTS public.study_partners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    course_id UUID NOT NULL,
    description TEXT NOT NULL,
    available_hours TEXT[] DEFAULT '{}',
    preferred_times TEXT[] DEFAULT '{}',
    contact_info TEXT,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '3 days'),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create shared_sessions table
CREATE TABLE IF NOT EXISTS public.shared_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    meeting_link TEXT NOT NULL,
    description TEXT,
    platform TEXT NOT NULL DEFAULT 'zoom',
    scheduled_time TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    max_participants INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    notification_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create user_course_progress table if not exists
CREATE TABLE IF NOT EXISTS public.user_course_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    course_id UUID NOT NULL,
    status TEXT DEFAULT 'active',
    progress_percentage INTEGER DEFAULT 0,
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    is_favorite BOOLEAN DEFAULT false,
    semester TEXT DEFAULT 'semester_a',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, course_id)
);

-- Create study_rooms table if not exists
CREATE TABLE IF NOT EXISTS public.study_rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL,
    creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    meeting_link TEXT,
    platform TEXT DEFAULT 'zoom',
    capacity INTEGER DEFAULT 6,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ==========================================
-- Row Level Security Policies
-- ==========================================

-- Enable RLS
ALTER TABLE public.study_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_rooms ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all study partners" ON public.study_partners;
DROP POLICY IF EXISTS "Users can create study partners" ON public.study_partners;
DROP POLICY IF EXISTS "Users can update own study partners" ON public.study_partners;
DROP POLICY IF EXISTS "Users can delete own study partners" ON public.study_partners;
DROP POLICY IF EXISTS "Admins can manage all study partners" ON public.study_partners;

DROP POLICY IF EXISTS "Users can view all shared sessions" ON public.shared_sessions;
DROP POLICY IF EXISTS "Users can create shared sessions" ON public.shared_sessions;
DROP POLICY IF EXISTS "Users can update own shared sessions" ON public.shared_sessions;
DROP POLICY IF EXISTS "Users can delete own shared sessions" ON public.shared_sessions;
DROP POLICY IF EXISTS "Admins can manage all shared sessions" ON public.shared_sessions;

DROP POLICY IF EXISTS "Users can view own progress" ON public.user_course_progress;
DROP POLICY IF EXISTS "Users can create own progress" ON public.user_course_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON public.user_course_progress;
DROP POLICY IF EXISTS "Admins can manage all progress" ON public.user_course_progress;

DROP POLICY IF EXISTS "Users can view all study rooms" ON public.study_rooms;
DROP POLICY IF EXISTS "Users can create study rooms" ON public.study_rooms;
DROP POLICY IF EXISTS "Users can update own study rooms" ON public.study_rooms;
DROP POLICY IF EXISTS "Admins can manage all study rooms" ON public.study_rooms;

-- Study Partners Policies
CREATE POLICY "Users can view all study partners"
ON public.study_partners FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create study partners"
ON public.study_partners FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own study partners"
ON public.study_partners FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own study partners"
ON public.study_partners FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all study partners"
ON public.study_partners FOR ALL
USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Shared Sessions Policies
CREATE POLICY "Users can view all shared sessions"
ON public.shared_sessions FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create shared sessions"
ON public.shared_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shared sessions"
ON public.shared_sessions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own shared sessions"
ON public.shared_sessions FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all shared sessions"
ON public.shared_sessions FOR ALL
USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- User Course Progress Policies
CREATE POLICY "Users can view own progress"
ON public.user_course_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own progress"
ON public.user_course_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
ON public.user_course_progress FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all progress"
ON public.user_course_progress FOR ALL
USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Study Rooms Policies
CREATE POLICY "Users can view all study rooms"
ON public.study_rooms FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create study rooms"
ON public.study_rooms FOR INSERT
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update own study rooms"
ON public.study_rooms FOR UPDATE
USING (auth.uid() = creator_id);

CREATE POLICY "Admins can manage all study rooms"
ON public.study_rooms FOR ALL
USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- ==========================================
-- Indexes for Performance
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_study_partners_course_id ON public.study_partners(course_id);
CREATE INDEX IF NOT EXISTS idx_study_partners_user_id ON public.study_partners(user_id);
CREATE INDEX IF NOT EXISTS idx_study_partners_expires_at ON public.study_partners(expires_at);

CREATE INDEX IF NOT EXISTS idx_shared_sessions_course_id ON public.shared_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_shared_sessions_user_id ON public.shared_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_sessions_scheduled_time ON public.shared_sessions(scheduled_time);

CREATE INDEX IF NOT EXISTS idx_user_course_progress_user_course ON public.user_course_progress(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_user_course_progress_favorite ON public.user_course_progress(user_id, is_favorite);

CREATE INDEX IF NOT EXISTS idx_study_rooms_course_id ON public.study_rooms(course_id);
CREATE INDEX IF NOT EXISTS idx_study_rooms_creator_id ON public.study_rooms(creator_id);

-- ==========================================
-- Handle Course Favorite Function
-- ==========================================

CREATE OR REPLACE FUNCTION public.handle_course_favorite(
    p_course_id UUID,
    p_is_favorite BOOLEAN DEFAULT true,
    p_semester TEXT DEFAULT 'semester_a'
) RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_result JSON;
BEGIN
    -- Get current user ID
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN json_build_object('error', 'User not authenticated');
    END IF;
    
    -- Insert or update the favorite status
    INSERT INTO public.user_course_progress (
        user_id,
        course_id,
        is_favorite,
        semester,
        status,
        progress_percentage
    ) VALUES (
        v_user_id,
        p_course_id,
        p_is_favorite,
        p_semester,
        'active',
        0
    )
    ON CONFLICT (user_id, course_id) 
    DO UPDATE SET
        is_favorite = p_is_favorite,
        semester = p_semester,
        updated_at = NOW();
    
    v_result := json_build_object(
        'success', true,
        'user_id', v_user_id,
        'course_id', p_course_id,
        'is_favorite', p_is_favorite,
        'semester', p_semester
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.handle_course_favorite TO authenticated;

-- Update trigger for user_course_progress
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_course_progress_updated_at
    BEFORE UPDATE ON public.user_course_progress
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shared_sessions_updated_at
    BEFORE UPDATE ON public.shared_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();