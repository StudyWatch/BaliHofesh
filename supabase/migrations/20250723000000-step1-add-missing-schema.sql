-- Step 1: Add missing fields to tutors table and create missing tables

-- Add missing columns to tutors table
ALTER TABLE tutors 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create tutor_courses junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS tutor_courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tutor_id UUID NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tutor_id, course_id)
);

-- Create tutor_reviews table
CREATE TABLE IF NOT EXISTS tutor_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tutor_id UUID NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create course_assignments table
CREATE TABLE IF NOT EXISTS course_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE,
    due_time TIME,
    assignment_type TEXT DEFAULT 'homework',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE tutor_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tutor_courses
CREATE POLICY "Allow read access to tutor_courses" ON tutor_courses FOR SELECT USING (true);
CREATE POLICY "Allow insert for authenticated users" ON tutor_courses FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow update for authenticated users" ON tutor_courses FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow delete for authenticated users" ON tutor_courses FOR DELETE USING (auth.role() = 'authenticated');

-- Create RLS policies for tutor_reviews
CREATE POLICY "Allow read access to tutor_reviews" ON tutor_reviews FOR SELECT USING (true);
CREATE POLICY "Allow insert for authenticated users" ON tutor_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow update for review owner" ON tutor_reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Allow delete for review owner" ON tutor_reviews FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for course_assignments
CREATE POLICY "Allow read access to course_assignments" ON course_assignments FOR SELECT USING (true);
CREATE POLICY "Allow insert for authenticated users" ON course_assignments FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Allow update for assignment creator" ON course_assignments FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Allow delete for assignment creator" ON course_assignments FOR DELETE USING (auth.uid() = created_by);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tutor_courses_tutor_id ON tutor_courses(tutor_id);
CREATE INDEX IF NOT EXISTS idx_tutor_courses_course_id ON tutor_courses(course_id);
CREATE INDEX IF NOT EXISTS idx_tutor_reviews_tutor_id ON tutor_reviews(tutor_id);
CREATE INDEX IF NOT EXISTS idx_tutor_reviews_user_id ON tutor_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_course_assignments_course_id ON course_assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_course_assignments_created_by ON course_assignments(created_by);

-- Update existing tutors to have a name if they don't already
UPDATE tutors 
SET name = COALESCE(name, email, 'מורה ללא שם')
WHERE name IS NULL OR name = '';