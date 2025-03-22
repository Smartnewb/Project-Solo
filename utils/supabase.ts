import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/supabase';

// 환경 변수가 올바르게 로드되었는지 확인
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 최소한의 정보만 로그
// API 요청 중복 이슈 해결을 위해 부필요한 로그 제거
console.log('=== Supabase 초기화 완료 ===');

// API 요청 중복 방지를 위한 캐시
const requestCache = new Map();
const pendingRequests = new Map();

// 주기적으로 캐시 정리 (60초마다)
if (typeof window !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    let expiredCount = 0;
    
    // 만료된 캐시 항목 제거
    requestCache.forEach((entry, key) => {
      const { timestamp } = entry;
      // 60초 이상 된 캐시는 제거
      if (now - timestamp > 60000) {
        requestCache.delete(key);
        expiredCount++;
      }
    });
    
    if (expiredCount > 0) {
      console.log(`🧹 캐시 정리 완료: ${expiredCount}개 항목 제거됨`);
    }
  }, 60000);
}

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

// 중복 요청 방지 로직
function createCachedFetch(originalFetch: (url: RequestInfo | URL, options?: RequestInit) => Promise<Response>) {
  return async (...args: [RequestInfo | URL, RequestInit?]) => {
    const [url, options] = args;
    
    // URL을 문자열로 변환
    const urlStr = url.toString();
    
    // 특정 엔드포인트에 대한 캐시 시간을 더 길게 설정 (30초)
    const LONG_CACHE_PATTERNS = [
      'system_settings',
      '/auth/v1/user',
      '/rest/v1/profiles'
    ];
    
    // GET 요청만 캐싱 (다른 요청은 항상 실행)
    const method = options?.method || 'GET';
    
    if (method !== 'GET') {
      console.log(`non-GET request to ${urlStr} (${method}), bypassing cache`);
      return originalFetch(...args);
    }
    
    // 요청 URL과 헤더를 기반으로 캐시 키 생성
    const headers = options?.headers || {};
    const cacheKey = `${urlStr}:${JSON.stringify(headers)}`;
    
    // 기본 캐시 만료 시간 (5초)
    let CACHE_TTL = 5000;
    
    // 특정 자주 호출되는 엔드포인트는 더 오래 캐싱
    if (LONG_CACHE_PATTERNS.some(pattern => urlStr.includes(pattern))) {
      CACHE_TTL = 30000; // 30초
      console.log(`🕒 연장된 캐시 TTL 적용 (30초): ${urlStr}`);
    }
    
    // 진행 중인 동일 요청이 있는지 확인
    if (pendingRequests.has(cacheKey)) {
      // 중복 요청 방지 (로그 제거)
      return pendingRequests.get(cacheKey);
    }
    
    // 최근 캐시된 응답이 있는지 확인
    const cachedResponse = requestCache.get(cacheKey);
    if (cachedResponse) {
      const { timestamp, response } = cachedResponse;
      if (Date.now() - timestamp < CACHE_TTL) {
        // 캐시 사용 (로그 제거)
        return Promise.resolve(response.clone());
      }
      // 캐시 만료 (로그 제거)
      requestCache.delete(cacheKey);
    }
    
    // 새 요청 시작 (로그 제거)
    const fetchPromise = originalFetch(...args).then((response: Response) => {
      // 성공한 응답만 캐싱
      if (response.ok) {
        requestCache.set(cacheKey, {
          timestamp: Date.now(),
          response: response.clone()
        });
      }
      
      // 진행 중인 요청 목록에서 제거
      pendingRequests.delete(cacheKey);
      
      return response;
    }).catch((error: Error) => {
      // 오류 발생 시 진행 중인 요청 목록에서 제거
      pendingRequests.delete(cacheKey);
      throw error;
    });
    
    // 진행 중인 요청 등록
    pendingRequests.set(cacheKey, fetchPromise);
    
    return fetchPromise;
  };
}

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
        fetch: createCachedFetch((...args: [RequestInfo | URL, RequestInit?]) => {
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
            // 네트워크 타임아웃 증가
            signal: AbortSignal.timeout(30000)
          };
          
          return fetch(url, fetchOptions as RequestInit);
        })
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
        fetch: createCachedFetch((...args: [RequestInfo | URL, RequestInit?]) => fetch(...args))
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
  preferred_age_type: string[];
  preferred_height_min: number;
  preferred_height_max: number;
  preferred_personalities: string[];
  preferred_dating_styles: string[];
  preferred_lifestyles: string[];
  preferred_interests: string[];
  preferred_drinking: string[];
  preferred_smoking: string[];
  preferred_tattoo: string[];
  preferred_mbti: string[];
  disliked_mbti: string[];
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