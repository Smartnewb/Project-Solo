-- Modify profiles table
alter table public.profiles
    add column if not exists university text,
    add column if not exists department text,
    add column if not exists grade text,
    add column if not exists instagram_id text;

-- Remove columns we don't need anymore
alter table public.profiles
    drop column if exists age,
    drop column if exists gender;
