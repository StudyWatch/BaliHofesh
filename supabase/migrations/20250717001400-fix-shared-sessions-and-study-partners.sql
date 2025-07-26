-- תיקון דחוף: יצירת טבלאות חסרות ותיקון שגיאות
-- ================================================================

-- 1. יצירת טבלת shared_sessions (מפגשי לימוד משותפים)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.shared_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  meeting_link TEXT NOT NULL,
  description TEXT,
  platform TEXT NOT NULL DEFAULT 'Zoom',
  contact_info TEXT,
  scheduled_start_time TIMESTAMP WITH TIME ZONE,
  estimated_duration INTEGER DEFAULT 60, -- בדקות
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '6 hours'),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. הוספת עמודות חסרות לטבלאות קיימות
-- ================================================================

-- הוספת contact_info לstudy_partners (אם לא קיים)
ALTER TABLE public.study_partners 
ADD COLUMN IF NOT EXISTS contact_info TEXT;

-- הוספת expires_at לstudy_partners (אם לא קיים)
ALTER TABLE public.study_partners 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '3 days');

-- הוספת contact_info וplatform לstudy_rooms (אם לא קיימים)
ALTER TABLE public.study_rooms 
ADD COLUMN IF NOT EXISTS contact_info TEXT,
ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'Zoom';

-- 3. פוליסיות RLS לshared_sessions
-- ================================================================
ALTER TABLE public.shared_sessions ENABLE ROW LEVEL SECURITY;

-- משתמשים יכולים לראות מפגשים משותפים פעילים
CREATE POLICY "Users can view active shared sessions" 
ON public.shared_sessions 
FOR SELECT 
USING (is_active = true AND expires_at > now());

-- משתמשים יכולים ליצור מפגשים משותפים משלהם
CREATE POLICY "Users can create their own shared sessions" 
ON public.shared_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- משתמשים יכולים לעדכן את המפגשים שלהם
CREATE POLICY "Users can update their own shared sessions" 
ON public.shared_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- משתמשים יכולים למחוק את המפגשים שלהם
CREATE POLICY "Users can delete their own shared sessions" 
ON public.shared_sessions 
FOR DELETE 
USING (auth.uid() = user_id);

-- אדמינים יכולים לגשת לכל המפגשים
CREATE POLICY "Admins can access all shared sessions" 
ON public.shared_sessions 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
));

-- 4. אינדקסים לביצועים
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_shared_sessions_course_active 
ON public.shared_sessions(course_id, is_active, expires_at DESC);

CREATE INDEX IF NOT EXISTS idx_shared_sessions_user 
ON public.shared_sessions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_study_partners_course_expires 
ON public.study_partners(course_id, expires_at DESC);

-- 5. פונקציות עזר
-- ================================================================

-- פונקציה לעדכון expires_at קיימים לstudy_partners
UPDATE public.study_partners 
SET expires_at = (created_at + INTERVAL '3 days')
WHERE expires_at IS NULL;

-- פונקציה לניקוי מפגשים משותפים שפגו
CREATE OR REPLACE FUNCTION public.cleanup_expired_shared_sessions()
RETURNS void AS $$
BEGIN
  -- מחיקת מפגשים משותפים שפגו
  DELETE FROM public.shared_sessions 
  WHERE expires_at < now() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Triggers להתראות על מפגשים חדשים
-- ================================================================

-- התראה על מפגש משותף חדש
CREATE OR REPLACE FUNCTION public.notify_new_shared_session()
RETURNS TRIGGER AS $$
DECLARE
  course_name TEXT;
  favorite_users UUID[];
BEGIN
  -- קבלת שם הקורס
  SELECT name_he INTO course_name 
  FROM public.courses 
  WHERE id = NEW.course_id;

  -- קבלת משתמשים שיש להם את הקורס במועדפים
  SELECT array_agg(user_id) INTO favorite_users
  FROM public.user_course_progress 
  WHERE course_id = NEW.course_id AND is_favorite = true;

  -- יצירת התראות למשתמשים רלוונטיים
  IF favorite_users IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, data)
    SELECT 
      unnest(favorite_users),
      'live_session',
      'מפגש לימוד חדש נפתח!',
      'מפגש חדש נפתח לקורס ' || COALESCE(course_name, 'קורס') || ': ' || NEW.title,
      jsonb_build_object(
        'course_id', NEW.course_id,
        'session_id', NEW.id,
        'course_name', course_name,
        'session_title', NEW.title,
        'meeting_link', NEW.meeting_link
      )
    WHERE unnest(favorite_users) != NEW.user_id; -- לא לשלוח למי שיצר
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_new_shared_session
  AFTER INSERT ON public.shared_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_shared_session();

-- 7. תיקון פוליסיות study_partners
-- ================================================================

-- וידוא שיש פוליסיות נכונות לstudy_partners
DROP POLICY IF EXISTS "Users can view study partners" ON public.study_partners;
DROP POLICY IF EXISTS "Users can create study partners" ON public.study_partners;
DROP POLICY IF EXISTS "Users can update their own study partners" ON public.study_partners;
DROP POLICY IF EXISTS "Users can delete their own study partners" ON public.study_partners;

CREATE POLICY "Users can view active study partners" 
ON public.study_partners 
FOR SELECT 
USING (expires_at > now());

CREATE POLICY "Users can create their own study partners" 
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

-- אדמינים יכולים לגשת לכל השותפויות
CREATE POLICY "Admins can access all study partners" 
ON public.study_partners 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
));