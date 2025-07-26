-- Create trigger to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', ''));
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add support for multiple exam dates per course
ALTER TABLE exam_dates 
ADD COLUMN IF NOT EXISTS exam_session VARCHAR(10) DEFAULT 'מועד א';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_exam_dates_course_session 
ON exam_dates(course_id, exam_session);

-- Update exam dates structure to support A, B, C sessions
UPDATE exam_dates 
SET exam_session = 'מועד א' 
WHERE exam_session IS NULL;