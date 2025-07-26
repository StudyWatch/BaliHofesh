-- שלב 2: פרופיל משתמש משודרג + מפגשים חיים + מערכת הודעות
-- ================================================================

-- 1. שדות פרופיל נוספים
-- ================================================================
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS university TEXT,
ADD COLUMN IF NOT EXISTS study_year TEXT,
ADD COLUMN IF NOT EXISTS telegram_username TEXT,
ADD COLUMN IF NOT EXISTS instagram_username TEXT;

-- 2. טבלת הודעות פרטיות (messages)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  thread_id UUID, -- לטיפול בשרשורי הודעות
  related_type TEXT, -- 'study_partner', 'shared_session', 'general'
  related_id UUID, -- ID של השותפות/מפגש שקשור להודעה
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS למערכת הודעות
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages" 
ON public.messages 
FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send messages" 
ON public.messages 
FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their received messages" 
ON public.messages 
FOR UPDATE 
USING (auth.uid() = recipient_id);

-- 3. טבלת התראות מתקדמת (שדרוג)
-- ================================================================
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS action_url TEXT,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 1; -- 1=נמוך, 2=רגיל, 3=גבוה

-- 4. טבלת פעילויות משתמש (activity_logs)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'joined_session', 'created_partner_request', 'sent_message'
  description TEXT NOT NULL,
  metadata JSONB, -- נתונים נוספים
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS לפעילויות
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activities" 
ON public.activity_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert activities" 
ON public.activity_logs 
FOR INSERT 
WITH CHECK (true); -- מערכת יכולה להוסיף פעילויות

-- 5. אינדקסים לביצועים
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_messages_sender_recipient 
ON public.messages(sender_id, recipient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_thread 
ON public.messages(thread_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_messages_unread 
ON public.messages(recipient_id, is_read, created_at DESC) 
WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_activity_logs_user 
ON public.activity_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_priority 
ON public.notifications(user_id, priority DESC, created_at DESC);

-- 6. פונקציות עזר למערכת הודעות
-- ================================================================

-- פונקציה ליצירת הודעה
CREATE OR REPLACE FUNCTION public.send_message(
  p_recipient_id UUID,
  p_subject TEXT,
  p_content TEXT,
  p_related_type TEXT DEFAULT NULL,
  p_related_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  message_id UUID;
  thread_id UUID;
BEGIN
  -- יצירת thread_id אם לא קיים
  thread_id := gen_random_uuid();
  
  INSERT INTO public.messages (
    sender_id,
    recipient_id,
    subject,
    content,
    thread_id,
    related_type,
    related_id
  ) VALUES (
    auth.uid(),
    p_recipient_id,
    p_subject,
    p_content,
    thread_id,
    p_related_type,
    p_related_id
  ) RETURNING id INTO message_id;
  
  -- יצירת התראה למקבל
  PERFORM public.create_notification(
    p_recipient_id,
    'new_message',
    'הודעה חדשה התקבלה',
    'קיבלת הודעה חדשה מ-' || COALESCE((SELECT name FROM public.profiles WHERE id = auth.uid()), 'משתמש'),
    jsonb_build_object(
      'message_id', message_id,
      'sender_id', auth.uid()
    )
  );
  
  RETURN message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- פונקציה לסימון הודעות כנקראו
CREATE OR REPLACE FUNCTION public.mark_messages_as_read(
  p_thread_id UUID DEFAULT NULL,
  p_message_ids UUID[] DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  IF p_thread_id IS NOT NULL THEN
    UPDATE public.messages 
    SET is_read = true, updated_at = now()
    WHERE thread_id = p_thread_id 
      AND recipient_id = auth.uid() 
      AND is_read = false;
  ELSIF p_message_ids IS NOT NULL THEN
    UPDATE public.messages 
    SET is_read = true, updated_at = now()
    WHERE id = ANY(p_message_ids) 
      AND recipient_id = auth.uid() 
      AND is_read = false;
  END IF;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. טריגרים להתראות אוטומטיות מתקדמות
-- ================================================================

-- התראה כשמפגש משותף עומד להתחיל
CREATE OR REPLACE FUNCTION public.notify_session_starting()
RETURNS void AS $$
DECLARE
  session_record RECORD;
BEGIN
  -- מפגשים שמתחילים בעוד 10 דקות
  FOR session_record IN
    SELECT ss.*, c.name_he as course_name, p.name as creator_name
    FROM public.shared_sessions ss
    JOIN public.courses c ON c.id = ss.course_id
    LEFT JOIN public.profiles p ON p.id = ss.user_id
    WHERE ss.scheduled_start_time BETWEEN now() AND now() + INTERVAL '10 minutes'
      AND ss.is_active = true
  LOOP
    -- התראה ליוצר
    PERFORM public.create_notification(
      session_record.user_id,
      'session_starting',
      'המפגש שלך מתחיל בקרוב!',
      'המפגש "' || session_record.title || '" מתחיל בעוד 10 דקות',
      jsonb_build_object(
        'session_id', session_record.id,
        'meeting_link', session_record.meeting_link,
        'course_name', session_record.course_name
      )
    );
    
    -- התראה למשתמשים שהקורס במועדפים שלהם
    INSERT INTO public.notifications (user_id, type, title, message, data, priority)
    SELECT 
      ucp.user_id,
      'live_session_starting',
      'מפגש חי מתחיל בקרוב!',
      'המפגש "' || session_record.title || '" בקורס ' || session_record.course_name || ' מתחיל בעוד 10 דקות',
      jsonb_build_object(
        'session_id', session_record.id,
        'meeting_link', session_record.meeting_link,
        'course_name', session_record.course_name,
        'creator_name', session_record.creator_name
      ),
      2
    FROM public.user_course_progress ucp
    WHERE ucp.course_id = session_record.course_id 
      AND ucp.is_favorite = true
      AND ucp.user_id != session_record.user_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. פונקציות לניהול פרופיל משתמש
-- ================================================================

-- פונקציה לעדכון פרופיל
CREATE OR REPLACE FUNCTION public.update_user_profile(
  p_name TEXT DEFAULT NULL,
  p_bio TEXT DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_whatsapp_url TEXT DEFAULT NULL,
  p_location TEXT DEFAULT NULL,
  p_university TEXT DEFAULT NULL,
  p_study_year TEXT DEFAULT NULL,
  p_telegram_username TEXT DEFAULT NULL,
  p_instagram_username TEXT DEFAULT NULL,
  p_show_contact_info BOOLEAN DEFAULT NULL,
  p_show_email BOOLEAN DEFAULT NULL,
  p_show_phone BOOLEAN DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  profile_id UUID;
BEGIN
  UPDATE public.profiles 
  SET
    name = COALESCE(p_name, name),
    bio = COALESCE(p_bio, bio),
    avatar_url = COALESCE(p_avatar_url, avatar_url),
    phone = COALESCE(p_phone, phone),
    whatsapp_url = COALESCE(p_whatsapp_url, whatsapp_url),
    location = COALESCE(p_location, location),
    university = COALESCE(p_university, university),
    study_year = COALESCE(p_study_year, study_year),
    telegram_username = COALESCE(p_telegram_username, telegram_username),
    instagram_username = COALESCE(p_instagram_username, instagram_username),
    show_contact_info = COALESCE(p_show_contact_info, show_contact_info),
    show_email = COALESCE(p_show_email, show_email),
    show_phone = COALESCE(p_show_phone, show_phone),
    updated_at = now()
  WHERE id = auth.uid()
  RETURNING id INTO profile_id;
  
  RETURN profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. הרשאות וגרנטים
-- ================================================================
GRANT ALL ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
GRANT ALL ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;

-- 10. טריגרים לעדכון updated_at
-- ================================================================
CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 11. ניקוי אוטומטי של הודעות והתראות ישנות
-- ================================================================
CREATE OR REPLACE FUNCTION public.cleanup_old_data()
RETURNS void AS $$
BEGIN
  -- מחיקת התראות ישנות (מעל חודש)
  DELETE FROM public.notifications 
  WHERE created_at < now() - INTERVAL '30 days';
  
  -- מחיקת פעילויות ישנות (מעל 3 חודשים)
  DELETE FROM public.activity_logs 
  WHERE created_at < now() - INTERVAL '90 days';
  
  -- מחיקת הודעות ישנות שנקראו (מעל 6 חודשים)
  DELETE FROM public.messages 
  WHERE created_at < now() - INTERVAL '180 days' 
    AND is_read = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;