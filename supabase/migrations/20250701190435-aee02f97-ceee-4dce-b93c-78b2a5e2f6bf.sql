
-- Allow admins to insert, update and delete courses
CREATE POLICY "Admins can manage courses" ON public.courses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Insert sample courses for Open University if they don't exist
DO $$
DECLARE
  open_uni_id uuid;
BEGIN
  -- Get Open University ID
  SELECT id INTO open_uni_id FROM public.institutions WHERE name_he = 'האוניברסיטה הפתוחה';
  
  -- Insert sample courses if Open University exists and no courses exist for it
  IF open_uni_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.courses WHERE institution_id = open_uni_id) THEN
    INSERT INTO public.courses (name_he, name_en, code, semester, exam_date, enable_collaboration, institution_id) VALUES
    ('מבוא למדעי המחשב', 'Introduction to Computer Science', '20471', 'סמסטר א'' תשפ"ה', '2024-02-15', true, open_uni_id),
    ('מבוא לכלכלה', 'Introduction to Economics', '20102', 'סמסטר א'' תשפ"ה', '2024-02-20', true, open_uni_id),
    ('מבוא לפסיכולוגיה', 'Introduction to Psychology', '20113', 'סמסטר א'' תשפ"ה', '2024-02-25', true, open_uni_id),
    ('חשבונאות פיננסית', 'Financial Accounting', '20203', 'סמסטר א'' תשפ"ה', '2024-03-01', false, open_uni_id),
    ('סטטיסטיקה', 'Statistics', '20219', 'סמסטר א'' תשפ"ה', '2024-03-05', true, open_uni_id),
    ('מבוא לסוציולוגיה', 'Introduction to Sociology', '20131', 'סמסטר א'' תשפ"ה', '2024-03-10', true, open_uni_id),
    ('אנגלית אקדמית', 'Academic English', '10251', 'סמסטר א'' תשפ"ה', '2024-03-15', false, open_uni_id),
    ('מבוא למשפטים', 'Introduction to Law', '20169', 'סמסטר א'' תשפ"ה', '2024-03-20', true, open_uni_id),
    ('היסטוריה של עם ישראל', 'History of the Jewish People', '20191', 'סמסטר א'' תשפ"ה', '2024-03-25', false, open_uni_id),
    ('מבוא לפילוסופיה', 'Introduction to Philosophy', '20165', 'סמסטר א'' תשפ"ה', '2024-03-30', true, open_uni_id),
    ('מבוא להנדסת תוכנה', 'Introduction to Software Engineering', '20581', 'סמסטר ב'' תשפ"ה', '2024-07-15', true, open_uni_id),
    ('מבנים בדידים', 'Discrete Mathematics', '20234', 'סמסטר ב'' תשפ"ה', '2024-07-20', true, open_uni_id);
  END IF;
END $$;
