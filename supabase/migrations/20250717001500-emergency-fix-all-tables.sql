-- תיקון חירום: יצירת כל הטבלאות החסרות עם כל העמודות
-- ================================================================

-- 1. בדיקה ויצירת טבלת shared_sessions
-- ================================================================
DROP TABLE IF EXISTS public.shared_sessions CASCADE;

CREATE TABLE public.shared_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  meeting_link TEXT NOT NULL,
  description TEXT,
  platform TEXT NOT NULL DEFAULT 'Zoom',
  contact_info TEXT,
  scheduled_start_time TIMESTAMP WITH TIME ZONE,
  estimated_duration INTEGER DEFAULT 60,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '6 hours'),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. וידוא שטבלת study_partners יש לה את כל העמודות
-- ================================================================
-- הוספת עמודות שחסרות אם הן לא קיימות
ALTER TABLE public.study_partners 
ADD COLUMN IF NOT EXISTS contact_info TEXT,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '3 days');

-- וידוא שהעמודה expires_at מוגדרת נכון לרשומות קיימות
UPDATE public.study_partners 
SET expires_at = (created_at + INTERVAL '3 days')
WHERE expires_at IS NULL;

-- 3. פוליסיות RLS לטבלת shared_sessions
-- ================================================================
ALTER TABLE public.shared_sessions ENABLE ROW LEVEL SECURITY;

-- מחיקת פוליסיות קיימות
DROP POLICY IF EXISTS "Users can view active shared sessions" ON public.shared_sessions;
DROP POLICY IF EXISTS "Users can create their own shared sessions" ON public.shared_sessions;
DROP POLICY IF EXISTS "Users can update their own shared sessions" ON public.shared_sessions;
DROP POLICY IF EXISTS "Users can delete their own shared sessions" ON public.shared_sessions;
DROP POLICY IF EXISTS "Admins can access all shared sessions" ON public.shared_sessions;

-- יצירת פוליסיות חדשות
CREATE POLICY "Anyone can view active shared sessions" 
ON public.shared_sessions 
FOR SELECT 
USING (is_active = true AND expires_at > now());

CREATE POLICY "Authenticated users can create shared sessions" 
ON public.shared_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shared sessions" 
ON public.shared_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shared sessions" 
ON public.shared_sessions 
FOR DELETE 
USING (auth.uid() = user_id);

-- 4. פוליסיות RLS לטבלת study_partners
-- ================================================================
ALTER TABLE public.study_partners ENABLE ROW LEVEL SECURITY;

-- מחיקת פוליסיות קיימות
DROP POLICY IF EXISTS "Users can view active study partners" ON public.study_partners;
DROP POLICY IF EXISTS "Users can create their own study partners" ON public.study_partners;
DROP POLICY IF EXISTS "Users can update their own study partners" ON public.study_partners;
DROP POLICY IF EXISTS "Users can delete their own study partners" ON public.study_partners;
DROP POLICY IF EXISTS "Admins can access all study partners" ON public.study_partners;

-- יצירת פוליסיות חדשות
CREATE POLICY "Anyone can view active study partners" 
ON public.study_partners 
FOR SELECT 
USING (expires_at > now());

CREATE POLICY "Authenticated users can create study partners" 
ON public.study_partners 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study partners" 
ON public.study_partners 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own study partners" 
ON public.study_partners 
FOR DELETE 
USING (auth.uid() = user_id);

-- 5. אינדקסים לביצועים
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_shared_sessions_course_active 
ON public.shared_sessions(course_id, is_active, expires_at DESC);

CREATE INDEX IF NOT EXISTS idx_shared_sessions_user 
ON public.shared_sessions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_study_partners_course_expires 
ON public.study_partners(course_id, expires_at DESC);

CREATE INDEX IF NOT EXISTS idx_study_partners_user 
ON public.study_partners(user_id, created_at DESC);

-- 6. יצירת פונקציות עזר
-- ================================================================

-- פונקציה לניקוי מפגשים שפגו
CREATE OR REPLACE FUNCTION public.cleanup_expired_content()
RETURNS void AS $$
BEGIN
  -- מחיקת מפגשים משותפים שפגו
  DELETE FROM public.shared_sessions 
  WHERE expires_at < now() - INTERVAL '1 hour';
  
  -- מחיקת שותפי למידה שפגו
  DELETE FROM public.study_partners 
  WHERE expires_at < now() - INTERVAL '1 hour';
  
  -- מחיקת חדרי לימוד שפגו (אם קיימים)
  DELETE FROM public.study_rooms 
  WHERE expires_at < now() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Grant הרשאות
-- ================================================================
GRANT ALL ON public.shared_sessions TO authenticated;
GRANT ALL ON public.shared_sessions TO service_role;
GRANT ALL ON public.study_partners TO authenticated;
GRANT ALL ON public.study_partners TO service_role;

-- 8. טריגרים לעדכון updated_at
-- ================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_shared_sessions_updated_at ON public.shared_sessions;
CREATE TRIGGER update_shared_sessions_updated_at
    BEFORE UPDATE ON public.shared_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();