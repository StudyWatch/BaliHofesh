
-- Create table for shared study sessions
CREATE TABLE public.shared_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  meeting_link TEXT NOT NULL,
  description TEXT,
  platform TEXT DEFAULT 'other',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '2 hours'),
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS on shared_sessions
ALTER TABLE public.shared_sessions ENABLE ROW LEVEL SECURITY;

-- Anyone can view active sessions
CREATE POLICY "Anyone can view active sessions" ON public.shared_sessions
  FOR SELECT USING (is_active = true AND expires_at > now());

-- Authenticated users can create sessions
CREATE POLICY "Authenticated users can create sessions" ON public.shared_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users can update their own sessions" ON public.shared_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own sessions
CREATE POLICY "Users can delete their own sessions" ON public.shared_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Admins can manage all sessions
CREATE POLICY "Admins can manage all sessions" ON public.shared_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Update study_partners table to add expires_at if not exists
DO $$
BEGIN
  -- Check if expires_at column exists, if not add it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'study_partners' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE public.study_partners 
    ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '30 days');
  END IF;
END $$;

-- Add preferred_times column to study_partners if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'study_partners' AND column_name = 'preferred_times'
  ) THEN
    ALTER TABLE public.study_partners 
    ADD COLUMN preferred_times TEXT[];
  END IF;
END $$;
