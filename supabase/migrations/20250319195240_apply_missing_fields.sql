-- Add missing fields for profiles table using TEXT instead of JSONB
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS personalities TEXT,
  ADD COLUMN IF NOT EXISTS dating_styles TEXT,
  ADD COLUMN IF NOT EXISTS ideal_lifestyles TEXT,
  ADD COLUMN IF NOT EXISTS interests TEXT,
  ADD COLUMN IF NOT EXISTS height INTEGER,
  ADD COLUMN IF NOT EXISTS drinking TEXT,
  ADD COLUMN IF NOT EXISTS smoking TEXT,
  ADD COLUMN IF NOT EXISTS tattoo TEXT,
  ADD COLUMN IF NOT EXISTS mbti TEXT;
