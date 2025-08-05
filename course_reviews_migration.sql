-- Course Reviews System Migration
-- This migration creates the course_reviews table and related functionality
-- 
-- To apply this migration:
-- 1. Go to your Supabase dashboard
-- 2. Navigate to the SQL Editor
-- 3. Copy and paste this entire script
-- 4. Run the script

-- Create course_reviews table
CREATE TABLE IF NOT EXISTS course_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    tips TEXT,
    helpful_count INTEGER DEFAULT 0,
    is_anonymous BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Constraints
    CONSTRAINT unique_user_course_review UNIQUE (course_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_course_reviews_course_id ON course_reviews(course_id);
CREATE INDEX IF NOT EXISTS idx_course_reviews_user_id ON course_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_course_reviews_rating ON course_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_course_reviews_created_at ON course_reviews(created_at);

-- Enable RLS
ALTER TABLE course_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for course_reviews
-- Anyone can view course reviews
CREATE POLICY "Anyone can view course reviews" ON course_reviews
    FOR SELECT USING (true);

-- Authenticated users can insert their own reviews
CREATE POLICY "Users can insert their own course reviews" ON course_reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
CREATE POLICY "Users can update their own course reviews" ON course_reviews
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete their own course reviews" ON course_reviews
    FOR DELETE USING (auth.uid() = user_id);

-- Add notification_preferences column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
    "site_notifications": true,
    "push_notifications": false,
    "assignment_reminders": true,
    "exam_reminders": true,
    "study_partner_alerts": true,
    "system_updates": true,
    "email_digest": false
}';

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('assignment', 'exam', 'session', 'partner', 'system', 'message')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN DEFAULT false,
    delivery_target TEXT DEFAULT 'site' CHECK (delivery_target IN ('site', 'push', 'both')),
    is_critical BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    assignment_id UUID,
    exam_id UUID
);

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON notifications(expires_at);

-- Enable RLS for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
-- Users can only see their own notifications
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Create course_participants table for tracking course enrollment
CREATE TABLE IF NOT EXISTS course_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    
    -- Ensure unique participation per course
    CONSTRAINT unique_course_participant UNIQUE (course_id, user_id)
);

-- Create indexes for course_participants
CREATE INDEX IF NOT EXISTS idx_course_participants_course_id ON course_participants(course_id);
CREATE INDEX IF NOT EXISTS idx_course_participants_user_id ON course_participants(user_id);

-- Enable RLS for course_participants
ALTER TABLE course_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for course_participants
-- Anyone can view course participants
CREATE POLICY "Anyone can view course participants" ON course_participants
    FOR SELECT USING (true);

-- Authenticated users can join courses
CREATE POLICY "Users can join courses" ON course_participants
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own participation
CREATE POLICY "Users can update their own participation" ON course_participants
    FOR UPDATE USING (auth.uid() = user_id);

-- Create helpful_reviews table for tracking helpful votes
CREATE TABLE IF NOT EXISTS helpful_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    review_id UUID NOT NULL REFERENCES course_reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Ensure one vote per user per review
    CONSTRAINT unique_helpful_vote UNIQUE (review_id, user_id)
);

-- Create indexes for helpful_reviews
CREATE INDEX IF NOT EXISTS idx_helpful_reviews_review_id ON helpful_reviews(review_id);
CREATE INDEX IF NOT EXISTS idx_helpful_reviews_user_id ON helpful_reviews(user_id);

-- Enable RLS for helpful_reviews
ALTER TABLE helpful_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for helpful_reviews
-- Anyone can view helpful votes
CREATE POLICY "Anyone can view helpful votes" ON helpful_reviews
    FOR SELECT USING (true);

-- Authenticated users can vote
CREATE POLICY "Users can vote on reviews" ON helpful_reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can remove their own votes
CREATE POLICY "Users can remove their own votes" ON helpful_reviews
    FOR DELETE USING (auth.uid() = user_id);

-- Function to update helpful_count when votes are added/removed
CREATE OR REPLACE FUNCTION update_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE course_reviews 
        SET helpful_count = helpful_count + 1 
        WHERE id = NEW.review_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE course_reviews 
        SET helpful_count = helpful_count - 1 
        WHERE id = OLD.review_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic helpful_count updates
DROP TRIGGER IF EXISTS trigger_update_helpful_count_insert ON helpful_reviews;
CREATE TRIGGER trigger_update_helpful_count_insert
    AFTER INSERT ON helpful_reviews
    FOR EACH ROW EXECUTE FUNCTION update_helpful_count();

DROP TRIGGER IF EXISTS trigger_update_helpful_count_delete ON helpful_reviews;
CREATE TRIGGER trigger_update_helpful_count_delete
    AFTER DELETE ON helpful_reviews
    FOR EACH ROW EXECUTE FUNCTION update_helpful_count();

-- Create function to get course rating summary
CREATE OR REPLACE FUNCTION get_course_rating_summary(course_uuid UUID)
RETURNS TABLE (
    average_rating DECIMAL(3,2),
    total_reviews INTEGER,
    rating_distribution JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ROUND(AVG(rating)::DECIMAL, 2) as average_rating,
        COUNT(*)::INTEGER as total_reviews,
        jsonb_build_object(
            '5', COUNT(*) FILTER (WHERE rating = 5),
            '4', COUNT(*) FILTER (WHERE rating = 4),
            '3', COUNT(*) FILTER (WHERE rating = 3),
            '2', COUNT(*) FILTER (WHERE rating = 2),
            '1', COUNT(*) FILTER (WHERE rating = 1)
        ) as rating_distribution
    FROM course_reviews 
    WHERE course_id = course_uuid;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT ALL ON course_reviews TO authenticated;
GRANT ALL ON notifications TO authenticated;
GRANT ALL ON course_participants TO authenticated;
GRANT ALL ON helpful_reviews TO authenticated;

GRANT SELECT ON course_reviews TO anon;
GRANT SELECT ON course_participants TO anon;
GRANT SELECT ON helpful_reviews TO anon;