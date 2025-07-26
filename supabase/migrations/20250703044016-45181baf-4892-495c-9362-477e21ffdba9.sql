-- Create the update_updated_at_column function first
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create exam_dates table for multiple exam dates per course
CREATE TABLE public.exam_dates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  exam_type TEXT NOT NULL, -- 'מועד א׳', 'מועד א2', 'מועד ב׳', etc.
  exam_date DATE NOT NULL,
  exam_time TIME NOT NULL DEFAULT '09:00',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create marathon_registrations table
CREATE TABLE public.marathon_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  registration_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT DEFAULT 'registered',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add scheduled_start_time to shared_sessions for timed sessions
ALTER TABLE public.shared_sessions 
ADD COLUMN scheduled_start_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN estimated_duration INTEGER DEFAULT 120; -- minutes

-- Create summaries table for future file management
CREATE TABLE public.course_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_type TEXT, -- 'summary', 'formula', 'practice'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.exam_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marathon_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_summaries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for exam_dates
CREATE POLICY "Everyone can view exam dates" 
ON public.exam_dates FOR SELECT USING (true);

CREATE POLICY "Admins can manage exam dates" 
ON public.exam_dates FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
));

-- RLS Policies for marathon_registrations  
CREATE POLICY "Everyone can register for marathons" 
ON public.marathon_registrations FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all registrations" 
ON public.marathon_registrations FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
));

CREATE POLICY "Admins can manage registrations" 
ON public.marathon_registrations FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
));

-- RLS Policies for course_summaries
CREATE POLICY "Everyone can view active summaries" 
ON public.course_summaries FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage summaries" 
ON public.course_summaries FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
));

-- Create triggers for updated_at
CREATE TRIGGER update_exam_dates_updated_at
  BEFORE UPDATE ON public.exam_dates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_course_summaries_updated_at
  BEFORE UPDATE ON public.course_summaries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();