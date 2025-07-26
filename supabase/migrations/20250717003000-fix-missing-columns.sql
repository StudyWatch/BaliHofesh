-- ==========================================
-- Schema Fix Migration - Adding Missing Columns
-- Fixing all missing columns found in tests
-- ==========================================

-- Add missing columns to study_partners table
DO $$ 
BEGIN
    -- Add contact_info column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'study_partners' 
        AND column_name = 'contact_info'
    ) THEN
        ALTER TABLE public.study_partners ADD COLUMN contact_info TEXT;
    END IF;

    -- Ensure preferred_times column exists and is correct type
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'study_partners' 
        AND column_name = 'preferred_times'
    ) THEN
        ALTER TABLE public.study_partners ADD COLUMN preferred_times TEXT[] DEFAULT '{}';
    END IF;
    
    -- Ensure expires_at exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'study_partners' 
        AND column_name = 'expires_at'
    ) THEN
        ALTER TABLE public.study_partners ADD COLUMN expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '3 days');
    END IF;
END $$;

-- Add missing columns to shared_sessions table  
DO $$ 
BEGIN
    -- Add duration_minutes column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shared_sessions' 
        AND column_name = 'duration_minutes'
    ) THEN
        ALTER TABLE public.shared_sessions ADD COLUMN duration_minutes INTEGER DEFAULT 60;
    END IF;

    -- Add max_participants column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shared_sessions' 
        AND column_name = 'max_participants'
    ) THEN
        ALTER TABLE public.shared_sessions ADD COLUMN max_participants INTEGER DEFAULT 10;
    END IF;

    -- Add notification_sent column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shared_sessions' 
        AND column_name = 'notification_sent'
    ) THEN
        ALTER TABLE public.shared_sessions ADD COLUMN notification_sent BOOLEAN DEFAULT false;
    END IF;

    -- Ensure updated_at exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shared_sessions' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.shared_sessions ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Add missing columns to user_course_progress table
DO $$ 
BEGIN
    -- Add is_favorite column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_course_progress' 
        AND column_name = 'is_favorite'
    ) THEN
        ALTER TABLE public.user_course_progress ADD COLUMN is_favorite BOOLEAN DEFAULT false;
    END IF;

    -- Add semester column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_course_progress' 
        AND column_name = 'semester'
    ) THEN
        ALTER TABLE public.user_course_progress ADD COLUMN semester TEXT DEFAULT 'semester_a';
    END IF;

    -- Ensure updated_at exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_course_progress' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.user_course_progress ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- ==========================================
-- Update RLS Policies for Admin Access
-- ==========================================

-- Drop and recreate policies for study_partners
DROP POLICY IF EXISTS "Users can view all study partners" ON public.study_partners;
DROP POLICY IF EXISTS "Users can create study partners" ON public.study_partners;
DROP POLICY IF EXISTS "Users can update own study partners" ON public.study_partners;
DROP POLICY IF EXISTS "Users can delete own study partners" ON public.study_partners;
DROP POLICY IF EXISTS "Admins can manage all study partners" ON public.study_partners;

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

-- Drop and recreate policies for shared_sessions
DROP POLICY IF EXISTS "Users can view all shared sessions" ON public.shared_sessions;
DROP POLICY IF EXISTS "Users can create shared sessions" ON public.shared_sessions;
DROP POLICY IF EXISTS "Users can update own shared sessions" ON public.shared_sessions;
DROP POLICY IF EXISTS "Users can delete own shared sessions" ON public.shared_sessions;
DROP POLICY IF EXISTS "Admins can manage all shared sessions" ON public.shared_sessions;

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

-- Drop and recreate policies for user_course_progress
DROP POLICY IF EXISTS "Users can view own progress" ON public.user_course_progress;
DROP POLICY IF EXISTS "Users can create own progress" ON public.user_course_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON public.user_course_progress;
DROP POLICY IF EXISTS "Admins can manage all progress" ON public.user_course_progress;

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

-- ==========================================
-- Create Indexes for Better Performance
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_study_partners_course_expires 
ON public.study_partners(course_id, expires_at) 
WHERE expires_at > NOW();

CREATE INDEX IF NOT EXISTS idx_shared_sessions_course_scheduled 
ON public.shared_sessions(course_id, scheduled_time, is_active) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_user_progress_user_favorite 
ON public.user_course_progress(user_id, is_favorite) 
WHERE is_favorite = true;

-- ==========================================
-- Updated Triggers for automatic updated_at
-- ==========================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for automatic updated_at updates
DROP TRIGGER IF EXISTS update_user_course_progress_updated_at ON public.user_course_progress;
CREATE TRIGGER update_user_course_progress_updated_at
    BEFORE UPDATE ON public.user_course_progress
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_shared_sessions_updated_at ON public.shared_sessions;
CREATE TRIGGER update_shared_sessions_updated_at
    BEFORE UPDATE ON public.shared_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();