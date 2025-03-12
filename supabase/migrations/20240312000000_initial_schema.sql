-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.matches;
DROP TABLE IF EXISTS public.matching_requests;
DROP TABLE IF EXISTS public.user_preferences;
DROP TABLE IF EXISTS public.profiles;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user preferences table
CREATE TABLE public.user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    preferred_genres TEXT[],
    preferred_days TEXT[],
    preferred_times TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create matching_requests table
CREATE TABLE public.matching_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending',
    preferred_date DATE,
    preferred_time TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'matched', 'cancelled'))
);

-- Create matches table
CREATE TABLE public.matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user1_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    user2_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    match_date DATE,
    match_time TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_match_status CHECK (status IN ('pending', 'accepted', 'rejected', 'completed'))
);

-- Create functions and triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_matching_requests_updated_at ON public.matching_requests;
CREATE TRIGGER update_matching_requests_updated_at
    BEFORE UPDATE ON public.matching_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_matches_updated_at ON public.matches;
CREATE TRIGGER update_matches_updated_at
    BEFORE UPDATE ON public.matches
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matching_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- User preferences policies
DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
CREATE POLICY "Users can view own preferences"
ON public.user_preferences FOR SELECT
TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_preferences.user_id
    AND profiles.user_id = auth.uid()
));

DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
CREATE POLICY "Users can insert own preferences"
ON public.user_preferences FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_preferences.user_id
    AND profiles.user_id = auth.uid()
));

DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;
CREATE POLICY "Users can update own preferences"
ON public.user_preferences FOR UPDATE
TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_preferences.user_id
    AND profiles.user_id = auth.uid()
));

-- Matching requests policies
DROP POLICY IF EXISTS "Users can view own matching requests" ON public.matching_requests;
CREATE POLICY "Users can view own matching requests"
ON public.matching_requests FOR SELECT
TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = matching_requests.user_id
    AND profiles.user_id = auth.uid()
));

DROP POLICY IF EXISTS "Users can insert own matching requests" ON public.matching_requests;
CREATE POLICY "Users can insert own matching requests"
ON public.matching_requests FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = matching_requests.user_id
    AND profiles.user_id = auth.uid()
));

DROP POLICY IF EXISTS "Users can update own matching requests" ON public.matching_requests;
CREATE POLICY "Users can update own matching requests"
ON public.matching_requests FOR UPDATE
TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = matching_requests.user_id
    AND profiles.user_id = auth.uid()
));

-- Matches policies
DROP POLICY IF EXISTS "Users can view their own matches" ON public.matches;
CREATE POLICY "Users can view their own matches"
ON public.matches FOR SELECT
TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND (
        profiles.id = matches.user1_id
        OR profiles.id = matches.user2_id
    )
)); 