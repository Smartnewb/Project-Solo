import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/supabase';

// 환경 변수가 올바르게 로드되었는지 확인
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 전체 환경 변수 출력 (디버깅 목적)
console.log('=== 환경 변수 확인 ===');
console.log('Supabase URL (전체값):', supabaseUrl);
console.log('Supabase Anon Key (시작 부분):', supabaseAnonKey ? supabaseAnonKey.substring(0, 10) + '...' : '없음');
console.log('========================');

// 단일 Supabase 클라이언트 인스턴스 생성 (성능 최적화)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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

// 환경 변수 디버깅
console.log('Supabase URL (마스킹됨):', supabaseUrl ? supabaseUrl.substring(0, 8) + '...' : '없음');
console.log('Supabase Anon Key 존재 여부:', !!supabaseAnonKey);

// 클라이언트 컴포넌트용 클라이언트
export const createClientSupabaseClient = () => {
  console.log('[Supabase] 클라이언트 생성 - URL:', supabaseUrl ? supabaseUrl.substring(0, 8) + '...' : '없음');
  console.log('[Supabase] 클라이언트 생성 - Anon Key 존재:', !!supabaseAnonKey);
  
  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        flowType: 'implicit',
        storage: {
          getItem: (key) => {
            try {
              const item = localStorage.getItem(key);
              console.log(`Storage getItem: ${key} = ${item ? '값 있음' : '값 없음'} (길이: ${item?.length || 0})`);
              return item;
            } catch (error) {
              console.error('Storage getItem error:', error);
              return null;
            }
          },
          setItem: (key, value) => {
            try {
              console.log(`Storage setItem: ${key} (길이: ${value?.length || 0})`);
              localStorage.setItem(key, value);
            } catch (error) {
              console.error('Storage setItem error:', error);
            }
          },
          removeItem: (key) => {
            try {
              console.log(`Storage removeItem: ${key}`);
              localStorage.removeItem(key);
            } catch (error) {
              console.error('Storage removeItem error:', error);
            }
          }
        }
      },
      global: {
        fetch: (...args) => {
          const [url, options] = args;
          console.log(`Fetch request to: ${url}`);
          
          const headers = {
            ...options?.headers,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'apikey': supabaseAnonKey // API 키를 명시적으로 추가
          };
          
          console.log('Request headers:', Object.keys(headers).join(', '));
          
          const fetchOptions = {
            ...options,
            headers,
            // credentials: 'include', // CORS 오류 발생의 원인, 제거
            // 네트워크 타임아웃 증가
            signal: AbortSignal.timeout(30000)
          };
          
          return fetch(url, fetchOptions as RequestInit);
        }
      },
      realtime: {
        params: {
          eventsPerSecond: 1
        }
      }
    }
  );
};

// SSR용 브라우저 클라이언트
export const createBrowserSupabaseClient = () => {
  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        flowType: 'pkce'
      },
      global: {
        fetch: (...args) => fetch(...args)
      }
    }
  );
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

// 사용자 선호도 타입 정의 수정
export type UserPreferences = {
  id?: string;
  user_id: string;
  preferred_age_type: string;
  preferred_height_min: number;
  preferred_height_max: number;
  preferred_personalities: string[];
  preferred_dating_styles: string[];
  preferred_lifestyles: string[];
  preferred_interests: string[];
  preferred_drinking: string;
  preferred_smoking: string;
  preferred_tattoo: string;
  preferred_mbti: string;
  disliked_mbti: string;
  created_at?: string;
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