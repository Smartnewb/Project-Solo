import { supabase } from '@/utils/supabase';

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