-- Fix posts table structure
ALTER TABLE posts
  DROP COLUMN IF EXISTS timestamp,  -- created_at으로 대체
  DROP COLUMN IF EXISTS isedited,   -- isEdited로 통일
  ALTER COLUMN userId TYPE uuid USING userId::uuid,
  ALTER COLUMN author_id TYPE uuid USING author_id::uuid;

-- Fix comments table structure
ALTER TABLE comments
  ADD COLUMN IF NOT EXISTS nickname text,
  ADD COLUMN IF NOT EXISTS studentid text,
  ADD COLUMN IF NOT EXISTS isEdited boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS isdeleted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS reports text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS emoji text;

-- Add foreign key constraints
ALTER TABLE posts
  ADD CONSTRAINT posts_author_id_fkey 
  FOREIGN KEY (author_id) 
  REFERENCES profiles(id) 
  ON DELETE CASCADE;

ALTER TABLE comments
  ADD CONSTRAINT comments_author_id_fkey 
  FOREIGN KEY (author_id) 
  REFERENCES profiles(id) 
  ON DELETE CASCADE;
