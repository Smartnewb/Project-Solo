-- Create system_settings table
CREATE TABLE IF NOT EXISTS public.system_settings (
    id TEXT PRIMARY KEY,
    signup_enabled BOOLEAN DEFAULT true,
    matching_datetime TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to system_settings
CREATE POLICY "Allow public read access to system_settings"
    ON public.system_settings
    FOR SELECT
    TO public
    USING (true);

-- Allow only authenticated users with admin role to modify system_settings
CREATE POLICY "Allow admin to modify system_settings"
    ON public.system_settings
    FOR ALL
    TO authenticated
    USING (
        auth.jwt() ->> 'email' = 'notify@smartnewb.com'
    )
    WITH CHECK (
        auth.jwt() ->> 'email' = 'notify@smartnewb.com'
    );

-- Insert default settings
INSERT INTO public.system_settings (id, signup_enabled, matching_datetime)
VALUES ('signup_control', true, NULL)
ON CONFLICT (id) DO NOTHING; 