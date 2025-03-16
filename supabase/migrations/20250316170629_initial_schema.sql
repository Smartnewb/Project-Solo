-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS matching_requests CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Create profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    age INTEGER,
    gender TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create posts table
CREATE TABLE posts (
    userId UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    likes TEXT[] DEFAULT '{}',
    isEdited BOOLEAN DEFAULT false,
    isdeleted BOOLEAN DEFAULT false,
    reports TEXT[] DEFAULT '{}',
    nickname TEXT,
    studentid TEXT,
    emoji TEXT
);

-- Create comments table
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES posts(userId) ON DELETE CASCADE,
    author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    nickname TEXT,
    studentid TEXT,
    isEdited BOOLEAN DEFAULT false,
    isdeleted BOOLEAN DEFAULT false,
    reports TEXT[] DEFAULT '{}',
    emoji TEXT
);

-- Create reports table
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    reported_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Profiles
CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Users can insert their own profile" 
ON profiles FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

-- Posts
CREATE POLICY "Posts are viewable by everyone" 
ON posts FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Users can insert their own posts" 
ON posts FOR INSERT 
TO authenticated 
WITH CHECK (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = posts.author_id 
    AND profiles.user_id = auth.uid()
));

CREATE POLICY "Users can update own posts" 
ON posts FOR UPDATE 
TO authenticated 
USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = posts.author_id 
    AND profiles.user_id = auth.uid()
));

-- Comments
CREATE POLICY "Comments are viewable by everyone" 
ON comments FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Users can insert their own comments" 
ON comments FOR INSERT 
TO authenticated 
WITH CHECK (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = comments.author_id 
    AND profiles.user_id = auth.uid()
));

CREATE POLICY "Users can update own comments" 
ON comments FOR UPDATE 
TO authenticated 
USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = comments.author_id 
    AND profiles.user_id = auth.uid()
));
