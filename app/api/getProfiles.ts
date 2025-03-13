import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getProfiles = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*');

  if (error) {
    console.error('프로필 가져오기 에러:', error);
    return null;
  }

  return data;
}; 