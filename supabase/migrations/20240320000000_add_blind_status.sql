-- Add isBlinded column to posts table
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS isBlinded BOOLEAN DEFAULT FALSE;

-- Add isBlinded column to comments table
ALTER TABLE comments
ADD COLUMN IF NOT EXISTS isBlinded BOOLEAN DEFAULT FALSE;

-- Update RLS policies for posts
CREATE POLICY "Admins can manage blinded posts"
ON posts
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Update RLS policies for comments
CREATE POLICY "Admins can manage blinded comments"
ON comments
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_posts_isblinded ON posts(isBlinded);
CREATE INDEX IF NOT EXISTS idx_comments_isblinded ON comments(isBlinded); 