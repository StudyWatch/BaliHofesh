
-- Create products table for the store
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_he TEXT NOT NULL,
  name_en TEXT,
  description_he TEXT,
  description_en TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  image_url TEXT,
  link TEXT,
  is_subsidized BOOLEAN DEFAULT false,
  is_popular BOOLEAN DEFAULT false,
  is_new BOOLEAN DEFAULT false,
  is_exclusive BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tutors table
CREATE TABLE public.tutors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subjects TEXT[] NOT NULL,
  rating DECIMAL(3,2) DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  hourly_rate INTEGER NOT NULL,
  location TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  experience TEXT,
  description TEXT,
  availability TEXT,
  is_online BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tips table
CREATE TABLE public.tips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title_he TEXT NOT NULL,
  title_en TEXT,
  content_he TEXT NOT NULL,
  content_en TEXT,
  category TEXT NOT NULL,
  rating DECIMAL(3,2) DEFAULT 0,
  is_sponsored BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create institutions table
CREATE TABLE public.institutions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_he TEXT NOT NULL,
  name_en TEXT,
  type TEXT NOT NULL,
  logo_url TEXT,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create courses table
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE,
  name_he TEXT NOT NULL,
  name_en TEXT,
  code TEXT,
  semester TEXT,
  exam_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for public read access (since this is public content)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public can view products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public can view tutors" ON public.tutors FOR SELECT USING (true);
CREATE POLICY "Public can view tips" ON public.tips FOR SELECT USING (true);
CREATE POLICY "Public can view institutions" ON public.institutions FOR SELECT USING (true);
CREATE POLICY "Public can view courses" ON public.courses FOR SELECT USING (true);

-- Insert sample data for products
INSERT INTO public.products (name_he, name_en, description_he, description_en, price, original_price, category, tags, link, is_subsidized, is_popular) VALUES
('מנוי Notion Pro לסטודנטים', 'Notion Pro Student Subscription', 'מנוי מסובסד למערכת הניהול הטובה ביותר לסטודנטים. כולל תבניות מיוחדות ללימודים.', 'Subsidized subscription to the best management system for students. Includes special study templates.', 39, 79, 'software', ARRAY['פופולרי', 'בלעדי לסטודנטים'], 'https://notion.so/student', true, true),
('ספר "מדריך להצלחה בבחינות"', 'Book "Guide to Exam Success"', 'מדריך מקיף לטכניקות למידה יעילות, ניהול זמן ומתמודדות עם מתח בחינות.', 'Comprehensive guide to effective study techniques, time management and dealing with exam stress.', 89, 120, 'books', ARRAY['חדש', 'מומלץ'], '#', true, false),
('אוזניות Sony WH-1000XM4', 'Sony WH-1000XM4 Headphones', 'אוזניות עם ביטול רעש פעיל - מושלמות לריכוז בלימודים. מחיר מיוחד לסטודנטים.', 'Headphones with active noise cancellation - perfect for focusing on studies. Special price for students.', 899, 1299, 'electronics', ARRAY['בלעדי לסטודנטים'], '#', true, false);

-- Insert sample data for tutors
INSERT INTO public.tutors (name, subjects, rating, reviews_count, hourly_rate, location, phone, email, experience, description, availability, is_online, is_verified) VALUES
('דר׳ שרה כהן', ARRAY['מתמטיקה', 'פיזיקה'], 4.9, 127, 150, 'תל אביב', '052-1234567', 'sarah@example.com', '8 שנות ניסיון', 'מרצה במתמטיקה באוניברסיטת תל אביב עם התמחות באלגברה ליניארית וחשבון דיפרנציאלי.', 'ימי א-ה 14:00-20:00', true, true),
('פרופ׳ דוד לוי', ARRAY['כימיה', 'ביולוגיה'], 4.8, 89, 180, 'ירושלים', '053-9876543', 'david@example.com', '12 שנות ניסיון', 'פרופסור לכימיה אורגנית עם התמחות בביוכימיה ומחקר רפואי.', 'ימי ב-ו 16:00-21:00', false, true);

-- Insert sample data for tips
INSERT INTO public.tips (title_he, title_en, content_he, content_en, category, rating, is_sponsored) VALUES
('טכניקות זיכרון יעילות', 'Effective Memory Techniques', 'למד איך להשתמש בשיטות זיכרון מתקדמות כמו ארמון הזיכרון וחזרה מרווחת כדי לזכור מידע לטווח ארוך.', 'Learn how to use advanced memory methods like memory palace and spaced repetition to remember information long-term.', 'learning', 4.8, false),
('ניהול זמן בתקופת בחינות', 'Time Management During Exams', 'אסטרטגיות מקצועיות לתכנון לוח זמנים אפקטיבי, חלוקת חומר לימוד ושמירה על איזון בין לימודים למנוחה.', 'Professional strategies for planning an effective schedule, dividing study material and maintaining balance between studies and rest.', 'productivity', 4.5, false);
