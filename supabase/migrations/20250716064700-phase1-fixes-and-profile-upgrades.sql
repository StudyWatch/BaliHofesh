-- Phase 1: תיקון בעיות קיימות + תשתיות פרופיל בסיסיות
-- ========================================================================

-- 1. הוספת שדות פרופיל בסיסיים
-- ========================================================================
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_url TEXT,
ADD COLUMN IF NOT EXISTS show_contact_info BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_email BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS show_phone BOOLEAN DEFAULT false;

-- 2. הוספת שדה is_favorite לטבלת user_course_progress
-- ========================================================================
ALTER TABLE public.user_course_progress 
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS semester TEXT;

-- 3. תיקון שדה contact_info בטבלאות השותפויות (כבר נוספו בעדכונים קודמים)
-- ========================================================================
-- study_partners.contact_info כבר קיים
-- shared_sessions.contact_info כבר קיים  
-- study_rooms.contact_info וplatform כבר קיימים

-- 4. יצירת הוקים לניהול מועדפים
-- ========================================================================
CREATE OR REPLACE FUNCTION public.handle_course_favorite(
  p_user_id UUID,
  p_course_id UUID,
  p_is_favorite BOOLEAN,
  p_semester TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  progress_id UUID;
BEGIN
  -- בדיקה אם קיים רשומה קיימת
  SELECT id INTO progress_id 
  FROM public.user_course_progress 
  WHERE user_id = p_user_id AND course_id = p_course_id;

  IF progress_id IS NOT NULL THEN
    -- עדכון רשומה קיימת
    UPDATE public.user_course_progress 
    SET 
      is_favorite = p_is_favorite,
      semester = COALESCE(p_semester, semester),
      updated_at = now()
    WHERE id = progress_id;
  ELSE
    -- יצירת רשומה חדשה
    INSERT INTO public.user_course_progress (
      user_id, 
      course_id, 
      is_favorite, 
      semester,
      status
    ) VALUES (
      p_user_id, 
      p_course_id, 
      p_is_favorite, 
      p_semester,
      'active'
    ) RETURNING id INTO progress_id;
  END IF;

  RETURN progress_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. פוליסיות RLS נוספות לפרופיל
-- ========================================================================
-- הוספת פוליסיה לצפייה פומבית בפרופילים בסיסיים (לתצוגת שותפויות)
CREATE POLICY "Public can view basic profile info" 
ON public.profiles 
FOR SELECT 
USING (true);  -- מאפשר צפייה בכל הפרופילים עבור תצוגת שותפויות

-- 6. הוספת אינדקסים לביצועים
-- ========================================================================
CREATE INDEX IF NOT EXISTS idx_user_course_progress_user_favorite 
ON public.user_course_progress(user_id, is_favorite) 
WHERE is_favorite = true;

CREATE INDEX IF NOT EXISTS idx_user_course_progress_course_semester 
ON public.user_course_progress(course_id, semester);

-- 7. פוליסיות נוספות למערכת הודעות (הטבלה כבר קיימת)
-- ========================================================================
-- messages table כבר קיימת עם פוליסיות מתאימות

-- 8. הוספת trigger לניקוי שותפויות שפגו
-- ========================================================================
CREATE OR REPLACE FUNCTION public.cleanup_expired_partnerships()
RETURNS void AS $$
BEGIN
  -- מחיקת שותפי למידה שפגו
  DELETE FROM public.study_partners 
  WHERE expires_at < now() - INTERVAL '1 day';

  -- מחיקת מפגשים משותפים שפגו
  DELETE FROM public.shared_sessions 
  WHERE expires_at < now() - INTERVAL '1 day';

  -- מחיקת חדרי לימוד שפגו
  DELETE FROM public.study_rooms 
  WHERE expires_at < now() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- יצירת cronjob לניקוי אוטומטי (יש לאפשר בהגדרות Supabase)
-- SELECT cron.schedule('cleanup-expired-partnerships', '0 2 * * *', 'SELECT public.cleanup_expired_partnerships();');

-- 9. עדכון מבנה notification system 
-- ========================================================================
-- שיפור notifications table אם קיימת או יצירתה
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'new_study_partner', 'live_session', 'course_favorite', 'message'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB, -- נתונים נוספים (course_id, partner_id, etc.)
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS עבור notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- אינדקס לביצועים
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON public.notifications(user_id, is_read, created_at DESC);

-- 10. פונקציה ליצירת התראות אוטומטיות
-- ========================================================================
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_id, 
    type, 
    title, 
    message, 
    data
  ) VALUES (
    p_user_id, 
    p_type, 
    p_title, 
    p_message, 
    p_data
  ) RETURNING id INTO notification_id;

  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Triggers להתראות אוטומטיות
-- ========================================================================

-- התראה על שותף למידה חדש
CREATE OR REPLACE FUNCTION public.notify_new_study_partner()
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
      'new_study_partner',
      'שותף למידה חדש נמצא!',
      'שותף חדש הצטרף לקורס ' || COALESCE(course_name, 'קורס'),
      jsonb_build_object(
        'course_id', NEW.course_id,
        'partner_id', NEW.id,
        'course_name', course_name
      )
    WHERE unnest(favorite_users) != NEW.user_id; -- לא לשלוח למי שיצר
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_new_study_partner
  AFTER INSERT ON public.study_partners
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_study_partner();

-- 12. פולסיות נוספות להרשאות
-- ========================================================================

-- אנשים יכולים לראות פרופילים של שותפים במערכת
CREATE POLICY "Users can view partner profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.study_partners sp 
    WHERE sp.user_id = profiles.id
  ) OR 
  EXISTS (
    SELECT 1 FROM public.shared_sessions ss 
    WHERE ss.user_id = profiles.id
  )
);

-- פוליסיה לאדמינים לראות הכל
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
));