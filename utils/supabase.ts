import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 단일 Supabase 클라이언트 인스턴스 생성
const supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
export const supabase = supabaseInstance;

// SSR용 브라우저 클라이언트 (기존 클라이언트 재사용)
export const createBrowserSupabaseClient = () => supabaseInstance;

// 클라이언트 컴포넌트용 클라이언트 (기존 클라이언트 재사용)
export const createClientSupabaseClient = () => supabaseInstance;

// 사용자 프로필 타입 정의
export type Profile = {
  id: string;
  user_id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

// 사용자 선호도 타입 정의
export type UserPreferences = {
  id: string;
  user_id: string;
  preferred_genres: string[];
  preferred_days: string[];
  preferred_times: string[];
  created_at: string;
  updated_at: string;
};

// 매칭 요청 타입 정의
export type MatchingRequest = {
  id: string;
  user_id: string;
  status: 'pending' | 'matched' | 'cancelled';
  preferred_date: string;
  preferred_time: string;
  created_at: string;
  updated_at: string;
};

// 매칭 타입 정의
export type Match = {
  id: string;
  user1_id: string;
  user2_id: string;
  match_date: string;
  match_time: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  created_at: string;
  updated_at: string;
}; 