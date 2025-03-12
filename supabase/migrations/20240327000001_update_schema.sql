-- Add a new table for storing additional user data
CREATE TABLE public.user_additional_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    additional_info JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Example of modifying an existing table
ALTER TABLE public.profiles
ADD COLUMN bio TEXT; 