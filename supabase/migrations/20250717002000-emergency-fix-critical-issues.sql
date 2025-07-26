-- Emergency fix for critical issues in study_partners, shared_sessions, user_course_progress
-- Fix contact_info field, RLS policies for admins, and missing table columns

-- 1. Fix study_partners table - add contact_info column if missing
ALTER TABLE public.study_partners 
ADD COLUMN IF NOT EXISTS contact_info TEXT;

-- Add preferred_times column if missing (some versions might have it as different type)
ALTER TABLE public.study_partners 
ADD COLUMN IF NOT EXISTS preferred_times TEXT[] DEFAULT '{}';

-- 2. Ensure shared_sessions table exists with all required columns
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

-- 3. Add missing columns to user_course_progress if needed
ALTER TABLE public.user_course_progress 
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;

ALTER TABLE public.user_course_progress 
ADD COLUMN IF NOT EXISTS semester TEXT;

-- 4. Enable RLS on shared_sessions if not already enabled
ALTER TABLE public.shared_sessions ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing restrictive policies and create admin-friendly ones

-- Study Partners policies
DROP POLICY IF EXISTS "Anyone can view active study partners" ON public.study_partners;
DROP POLICY IF EXISTS "Authenticated users can create study partner requests" ON public.study_partners;
DROP POLICY IF EXISTS "Users can update their own study partner requests" ON public.study_partners;
DROP POLICY IF EXISTS "Users can delete their own study partner requests" ON public.study_partners;
DROP POLICY IF EXISTS "Admins can manage all study partner requests" ON public.study_partners;

CREATE POLICY "Anyone can view active study partners" ON public.study_partners
  FOR SELECT USING (expires_at > now());

CREATE POLICY "Users can manage their own study partner requests" ON public.study_partners
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all study partner requests" ON public.study_partners
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Shared Sessions policies
DROP POLICY IF EXISTS "Anyone can view active shared sessions" ON public.shared_sessions;
DROP POLICY IF EXISTS "Authenticated users can create shared sessions" ON public.shared_sessions;
DROP POLICY IF EXISTS "Users can update their own shared sessions" ON public.shared_sessions;
DROP POLICY IF EXISTS "Admins can manage all shared sessions" ON public.shared_sessions;

CREATE POLICY "Anyone can view active shared sessions" ON public.shared_sessions
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can manage their own shared sessions" ON public.shared_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all shared sessions" ON public.shared_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- User Course Progress policies
DROP POLICY IF EXISTS "Users can view their own course progress" ON public.user_course_progress;
DROP POLICY IF EXISTS "Users can update their own course progress" ON public.user_course_progress;
DROP POLICY IF EXISTS "Admins can manage all course progress" ON public.user_course_progress;

CREATE POLICY "Users can manage their own course progress" ON public.user_course_progress
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all course progress" ON public.user_course_progress
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Study Rooms policies (ensure admin access)
DROP POLICY IF EXISTS "Admins can manage all study rooms" ON public.study_rooms;

CREATE POLICY "Admins can manage all study rooms" ON public.study_rooms
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_study_partners_user_id ON public.study_partners(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_sessions_user_id ON public.shared_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_sessions_course_id ON public.shared_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_shared_sessions_scheduled_time ON public.shared_sessions(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_user_course_progress_user_course ON public.user_course_progress(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_user_course_progress_is_favorite ON public.user_course_progress(is_favorite);

-- 7. Update function for handle_course_favorite to work properly
CREATE OR REPLACE FUNCTION public.handle_course_favorite(
  p_user_id UUID,
  p_course_id UUID,
  p_is_favorite BOOLEAN,
  p_semester TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  -- Insert or update user course progress
  INSERT INTO public.user_course_progress (
    user_id, 
    course_id, 
    is_favorite, 
    semester,
    status,
    progress_percentage
  )
  VALUES (
    p_user_id, 
    p_course_id, 
    p_is_favorite, 
    p_semester,
    'active',
    0
  )
  ON CONFLICT (user_id, course_id) 
  DO UPDATE SET 
    is_favorite = p_is_favorite,
    semester = COALESCE(p_semester, user_course_progress.semester),
    updated_at = now();

  -- Return success result
  result := json_build_object(
    'success', true,
    'user_id', p_user_id,
    'course_id', p_course_id,
    'is_favorite', p_is_favorite,
    'semester', p_semester
  );

  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    -- Return error result
    result := json_build_object(
      'success', false,
      'error', SQLERRM
    );
    RETURN result;
END;
$$;