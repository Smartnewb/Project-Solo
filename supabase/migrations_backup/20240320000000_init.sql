-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    age INTEGER,
    gender TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user1_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    user2_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    match_date DATE,
    match_time TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_match_status CHECK (status IN ('pending', 'accepted', 'rejected', 'completed'))
);

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
    userId UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID,
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
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES posts(userId) ON DELETE CASCADE,
    author_id UUID,
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
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID,
    reported_id UUID,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- Insert sample users data (without admin)
INSERT INTO auth.users (id, email)
VALUES 
  (uuid_generate_v4(), 'user1@example.com'),
  (uuid_generate_v4(), 'user2@example.com'),
  (uuid_generate_v4(), 'user3@example.com')
ON CONFLICT (id) DO NOTHING;

-- Insert sample profiles (without admin)
INSERT INTO profiles (id, user_id, name, age, gender)
SELECT 
  id,
  id,
  CASE 
    WHEN email = 'user1@example.com' THEN '김철수'
    WHEN email = 'user2@example.com' THEN '이영희'
    ELSE '박지민'
  END,
  CASE 
    WHEN email = 'user1@example.com' THEN 30
    WHEN email = 'user2@example.com' THEN 28
    ELSE 32
  END,
  CASE 
    WHEN email = 'user1@example.com' THEN '남자'
    WHEN email = 'user2@example.com' THEN '여자'
    ELSE '남자'
  END
FROM auth.users
WHERE email != 'admin@smartnewbie.com'
ON CONFLICT (id) DO NOTHING; 