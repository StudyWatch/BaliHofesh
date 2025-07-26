
-- Comprehensive upgrade migration for the perfect version
-- Adding all required tables and fields for the new features

-- 1. Add missing fields to user_course_progress
ALTER TABLE user_course_progress 
ADD COLUMN IF NOT EXISTS selected_exam_session TEXT,
ADD COLUMN IF NOT EXISTS selected_exam_date DATE,
ADD COLUMN IF NOT EXISTS selected_exam_time TIME;

-- 2. Add missing fields to tutors table
ALTER TABLE tutors 
ADD COLUMN IF NOT EXISTS trial_lesson BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS trial_price NUMERIC,
ADD COLUMN IF NOT EXISTS is_student BOOLEAN DEFAULT false;

-- 3. Create course_assignments table for homework/assignments
CREATE TABLE IF NOT EXISTS course_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE NOT NULL,
    due_time TIME,
    assignment_type TEXT DEFAULT 'homework',
    created_by UUID REFERENCES auth.users(id),
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Create tutor_courses table for tutor-course relationships
CREATE TABLE IF NOT EXISTS tutor_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    course_grade NUMERIC CHECK (course_grade >= 0 AND course_grade <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(tutor_id, course_id)
);

-- 5. Create tutor_reviews table for tutor ratings and reviews
CREATE TABLE IF NOT EXISTS tutor_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating NUMERIC NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(tutor_id, user_id)
);

-- 6. Enhanced notifications table for advanced notification system
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    related_entity_type TEXT,
    related_entity_id UUID,
    scheduled_for TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on all new tables
ALTER TABLE course_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for course_assignments
CREATE POLICY "Users can view all assignments" ON course_assignments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create assignments" ON course_assignments
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own assignments" ON course_assignments
    FOR UPDATE USING (auth.uid() = created_by OR auth.role() = 'service_role');

CREATE POLICY "Users can delete their own assignments" ON course_assignments
    FOR DELETE USING (auth.uid() = created_by OR auth.role() = 'service_role');

-- RLS Policies for tutor_courses
CREATE POLICY "Users can view tutor courses" ON tutor_courses
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Tutors can manage their courses" ON tutor_courses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM tutors 
            WHERE tutors.id = tutor_courses.tutor_id 
            AND tutors.user_id = auth.uid()
        )
        OR auth.role() = 'service_role'
    );

-- RLS Policies for tutor_reviews
CREATE POLICY "Users can view all reviews" ON tutor_reviews
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create reviews" ON tutor_reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON tutor_reviews
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" ON tutor_reviews
    FOR DELETE USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON notifications
    FOR INSERT WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated');

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_course_assignments_updated_at 
    BEFORE UPDATE ON course_assignments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tutor_reviews_updated_at 
    BEFORE UPDATE ON tutor_reviews 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_course_assignments_course_id ON course_assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_course_assignments_due_date ON course_assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_tutor_courses_tutor_id ON tutor_courses(tutor_id);
CREATE INDEX IF NOT EXISTS idx_tutor_courses_course_id ON tutor_courses(course_id);
CREATE INDEX IF NOT EXISTS idx_tutor_reviews_tutor_id ON tutor_reviews(tutor_id);
CREATE INDEX IF NOT EXISTS idx_tutor_reviews_rating ON tutor_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_for ON notifications(scheduled_for);
