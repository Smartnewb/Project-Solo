import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 단일 Supabase 클라이언트 인스턴스 생성 (성능 최적화)
const supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // 토큰 만료 10분 전에만 갱신 시도 (기본값보다 늘림)
    flowType: 'pkce'
  },
  // 캐시 설정 최적화
  global: {
    fetch: (...args) => fetch(...args)
  },
  realtime: {
    // 실시간 기능 사용하지 않는 경우 비활성화
    params: {
      eventsPerSecond: 1
    }
  }
});

export const supabase = supabaseInstance;

// SSR용 브라우저 클라이언트 (최적화된 설정 적용)
export const createBrowserSupabaseClient = () => {
  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        flowType: 'pkce'
      }
    }
  );
};

// 클라이언트 컴포넌트용 클라이언트 (세션 저장 및 토큰 갱신 최적화)
export const createClientSupabaseClient = () => {
  // 이미 생성된 클라이언트 반환하여 여러 인스턴스 생성 방지
  return supabaseInstance;
};

// 인증 헬퍼 래퍼 (토큰 갱신 제한)
export const createOptimizedClientComponentClient = () => {
  return createClientComponentClient<Database>({
    options: {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // 토큰이 곧 만료될 때만 새로고침 시도
        detectSessionInUrl: false,
        flowType: 'pkce'
      },
      global: {
        fetch: (...args) => fetch(...args)
      }
    }
  });
};

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