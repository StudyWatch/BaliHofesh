-- Create course_groups table if it doesn't exist
CREATE TABLE IF NOT EXISTS course_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    whatsapp_link TEXT,
    discord_link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(course_id)
);

-- Enable RLS
ALTER TABLE course_groups ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users
CREATE POLICY "Allow read access for authenticated users" ON course_groups
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow insert/update/delete for authenticated users (admin functionality)
CREATE POLICY "Allow full access for authenticated users" ON course_groups
    FOR ALL USING (auth.role() = 'authenticated');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_course_groups_updated_at 
    BEFORE UPDATE ON course_groups 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();