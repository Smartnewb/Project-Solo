-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  role TEXT DEFAULT 'user',
  nickname TEXT,
  university TEXT,
  department TEXT,
  height INTEGER,
  mbti TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user1_id UUID REFERENCES profiles(id),
  user2_id UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  author_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reporter_id UUID REFERENCES profiles(id),
  reported_id UUID REFERENCES profiles(id),
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Insert sample users data (without admin)
INSERT INTO auth.users (id, email)
VALUES 
  (uuid_generate_v4(), 'user1@example.com'),
  (uuid_generate_v4(), 'user2@example.com'),
  (uuid_generate_v4(), 'user3@example.com')
ON CONFLICT (id) DO NOTHING;

-- Insert sample profiles (without admin)
INSERT INTO profiles (id, role, nickname, university, department, height, mbti)
SELECT 
  id,
  'user',
  CASE 
    WHEN email = 'user1@example.com' THEN '김철수'
    WHEN email = 'user2@example.com' THEN '이영희'
    ELSE '박지민'
  END,
  '한밭대학교',
  CASE 
    WHEN email = 'user1@example.com' THEN '컴퓨터공학과'
    WHEN email = 'user2@example.com' THEN '정보통신공학과'
    ELSE '전기공학과'
  END,
  CASE 
    WHEN email = 'user1@example.com' THEN 175
    WHEN email = 'user2@example.com' THEN 162
    ELSE 180
  END,
  CASE 
    WHEN email = 'user1@example.com' THEN 'ISTJ'
    WHEN email = 'user2@example.com' THEN 'ENFP'
    ELSE 'ENTJ'
  END
FROM auth.users
WHERE email != 'admin@smartnewbie.com'
ON CONFLICT (id) DO NOTHING; 