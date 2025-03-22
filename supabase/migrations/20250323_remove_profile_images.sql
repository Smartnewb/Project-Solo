-- Remove profileImages column from profiles table
ALTER TABLE profiles DROP COLUMN IF EXISTS profile_images;
