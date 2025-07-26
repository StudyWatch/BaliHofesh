
-- Create table for course groups (WhatsApp & Discord links)
CREATE TABLE public.course_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  whatsapp_link TEXT,
  discord_link TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for study rooms (live study sessions)
CREATE TABLE public.study_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  link TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for study partners (want to study together)
CREATE TABLE public.study_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  available_hours TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '3 days')
);

-- Add collaboration flag to courses table
ALTER TABLE public.courses ADD COLUMN enable_collaboration BOOLEAN DEFAULT false;

-- Enable RLS on new tables
ALTER TABLE public.course_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_partners ENABLE ROW LEVEL SECURITY;

-- RLS policies for course_groups (public read, admin write)
CREATE POLICY "Anyone can view course groups" ON public.course_groups
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage course groups" ON public.course_groups
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- RLS policies for study_rooms
CREATE POLICY "Anyone can view active study rooms" ON public.study_rooms
  FOR SELECT USING (status = 'open' AND expires_at > now());

CREATE POLICY "Authenticated users can create study rooms" ON public.study_rooms
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own study rooms" ON public.study_rooms
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Admins can manage all study rooms" ON public.study_rooms
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- RLS policies for study_partners
CREATE POLICY "Anyone can view active study partners" ON public.study_partners
  FOR SELECT USING (expires_at > now());

CREATE POLICY "Authenticated users can create study partner requests" ON public.study_partners
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study partner requests" ON public.study_partners
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own study partner requests" ON public.study_partners
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all study partner requests" ON public.study_partners
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_course_groups_course_id ON public.course_groups(course_id);
CREATE INDEX idx_study_rooms_course_id ON public.study_rooms(course_id);
CREATE INDEX idx_study_rooms_expires_at ON public.study_rooms(expires_at);
CREATE INDEX idx_study_partners_course_id ON public.study_partners(course_id);
CREATE INDEX idx_study_partners_expires_at ON public.study_partners(expires_at);
