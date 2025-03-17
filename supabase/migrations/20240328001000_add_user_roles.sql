-- Add role column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Add classification column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS classification varchar(1) CHECK (classification IN ('S', 'A', 'B', 'C'));

-- Create gender-specific profile tables if they don't exist
CREATE TABLE IF NOT EXISTS public.male_profiles (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text,
    age integer,
    gender text CHECK (gender = 'male'),
    instagramId text,
    classification text CHECK (classification IN ('S', 'A', 'B', 'C')),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.female_profiles (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text,
    age integer,
    gender text CHECK (gender = 'female'),
    instagramId text,
    classification text CHECK (classification IN ('S', 'A', 'B', 'C')),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Add classification column to male_profiles table
ALTER TABLE male_profiles ADD COLUMN IF NOT EXISTS classification varchar(1) CHECK (classification IN ('S', 'A', 'B', 'C'));

-- Add classification column to female_profiles table
ALTER TABLE female_profiles ADD COLUMN IF NOT EXISTS classification varchar(1) CHECK (classification IN ('S', 'A', 'B', 'C'));

-- Enable RLS on gender-specific profile tables
ALTER TABLE male_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE female_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for male_profiles
CREATE POLICY "Male profiles are viewable by admins" 
ON male_profiles FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.user_id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "Users can insert their own male profile" 
ON male_profiles FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own male profile" 
ON male_profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

-- Create RLS policies for female_profiles
CREATE POLICY "Female profiles are viewable by admins" 
ON female_profiles FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.user_id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "Users can insert their own female profile" 
ON female_profiles FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own female profile" 
ON female_profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

-- Create function to set initial admin
CREATE OR REPLACE FUNCTION set_initial_admin()
RETURNS void AS $$
BEGIN
    UPDATE profiles 
    SET role = 'admin' 
    WHERE user_id IN (
        SELECT id FROM auth.users 
        WHERE email = 'notify@smartnewb.com'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the function to set initial admin
SELECT set_initial_admin();

-- Update existing profiles with default classification
UPDATE profiles SET classification = 'C' WHERE classification IS NULL;
UPDATE male_profiles SET classification = 'C' WHERE classification IS NULL;
UPDATE female_profiles SET classification = 'C' WHERE classification IS NULL;

-- Update RLS policies to allow all operations for admins
CREATE POLICY "관리자는 모든 작업 가능" ON male_profiles
FOR ALL USING (
  auth.uid() IN (
    SELECT user_id FROM profiles 
    WHERE role = 'admin'
  )
);

CREATE POLICY "관리자는 모든 작업 가능" ON female_profiles
FOR ALL USING (
  auth.uid() IN (
    SELECT user_id FROM profiles 
    WHERE role = 'admin'
  )
);

-- Update RLS policies to allow all operations for users on their own profiles
CREATE POLICY "사용자는 자신의 프로필만 읽기/수정 가능" ON male_profiles
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "사용자는 자신의 프로필만 읽기/수정 가능" ON female_profiles
FOR ALL USING (auth.uid() = user_id);

-- male_profiles 테이블에 대한 RLS 정책 설정
ALTER TABLE male_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "관리자는 모든 male_profiles에 접근 가능"
ON male_profiles
FOR ALL
TO authenticated
USING (
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'notify@smartnewb.com'
  OR
  (CURRENT_SETTING('app.is_admin', TRUE)::boolean IS TRUE)
);

CREATE POLICY "사용자는 자신의 male_profile만 접근 가능"
ON male_profiles
FOR ALL
TO authenticated
USING (user_id = auth.uid());

-- female_profiles 테이블에 대한 RLS 정책 설정
ALTER TABLE female_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "관리자는 모든 female_profiles에 접근 가능"
ON female_profiles
FOR ALL
TO authenticated
USING (
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'notify@smartnewb.com'
  OR
  (CURRENT_SETTING('app.is_admin', TRUE)::boolean IS TRUE)
);

CREATE POLICY "사용자는 자신의 female_profile만 접근 가능"
ON female_profiles
FOR ALL
TO authenticated
USING (user_id = auth.uid()); 