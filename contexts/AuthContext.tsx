'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { createClientSupabaseClient } from '@/utils/supabase';
import { Profile } from '@/types';

const supabase = createClientSupabaseClient();

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  hasCompletedOnboarding: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (profile: Partial<Profile>) => Promise<{ error: Error | null }>;
};

const AuthContext = createContext<AuthContextType | null>(null);

const ADMIN_EMAIL = 'notify@smartnewb.com';

// 디바운스 함수 타입 정의
type DebouncedFunction<T extends (...args: any[]) => Promise<any>> = 
  (...args: Parameters<T>) => Promise<ReturnType<T>>;

// 디바운스 유틸리티 함수
function debounce<T extends (...args: any[]) => Promise<any>>(
  func: T, 
  wait: number
): DebouncedFunction<T> {
  let timeout: NodeJS.Timeout | null = null;
  let pendingPromise: Promise<ReturnType<T>> | null = null;
  
  return async function(...args: Parameters<T>): Promise<ReturnType<T>> {
    // 이미 진행 중인 요청이 있으면 그 결과를 반환
    if (pendingPromise) {
      return pendingPromise;
    }
    
    // 새 요청 생성
    const executeFunction = async (): Promise<ReturnType<T>> => {
      try {
        const result = await func(...args);
        return result;
      } finally {
        // 완료 후 초기화
        pendingPromise = null;
      }
    };

    // 이전 타이머가 있으면 취소
    if (timeout) {
      clearTimeout(timeout);
    }

    // 디바운스 적용
    return new Promise((resolve) => {
      pendingPromise = executeFunction();
      
      timeout = setTimeout(() => {
        resolve(pendingPromise as ReturnType<T>);
        timeout = null;
      }, wait);
    });
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // 세션 캐싱
  const sessionCache = useRef<{
    session: Session | null;
    timestamp: number;
    expiresIn: number;
  }>({
    session: null,
    timestamp: 0,
    expiresIn: 30000 // 30초 캐시
  });
  
  // 디바운스된 프로필 조회 함수
  const debouncedFetchProfile = useRef(debounce(fetchProfile, 300));

  // 세션 조회 함수 (캐싱 적용)
  const getSession = async () => {
    const now = Date.now();
    // 캐시가 유효하면 캐시된 세션 반환
    if (
      sessionCache.current.session && 
      now - sessionCache.current.timestamp < sessionCache.current.expiresIn
    ) {
      console.log('✅ 캐시된 세션 사용 (남은 시간:', 
        ((sessionCache.current.expiresIn - (now - sessionCache.current.timestamp)) / 1000).toFixed(1), '초)');
      return { 
        data: { session: sessionCache.current.session }, 
        error: null 
      };
    }
    
    // 캐시가 만료되었거나 없으면 새로 조회
    console.log('🔄 세션 새로 조회 (캐시 만료 또는 없음)');
    const { data, error } = await supabase.auth.getSession();
    
    // 성공 시 캐시 업데이트
    if (!error && data.session) {
      sessionCache.current = {
        session: data.session,
        timestamp: now,
        expiresIn: 30000 // 30초
      };
    }
    
    return { data, error };
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        console.log('AuthContext: 인증 상태 초기화 시작');
        
        const { data: { session }, error } = await getSession();
        
        if (error) {
          console.error('세션 확인 오류:', error);
          return;
        }
        
        if (session?.user) {
          console.log('기존 세션 발견, 사용자 정보 설정');
          setUser(session.user);
          
          // 관리자 여부 확인
          const isUserAdmin = session.user.email === ADMIN_EMAIL;
          setIsAdmin(isUserAdmin);
          console.log('관리자 여부:', isUserAdmin);
          
          // 관리자가 아닌 경우에만 프로필 확인
          if (!isUserAdmin) {
            await debouncedFetchProfile.current(session.user.id);
          } else {
            // 관리자는 온보딩이 필요없음
            setHasCompletedOnboarding(true);
          }
        } else {
          console.log('세션 없음, 로그인 필요');
        }
      } catch (err) {
        console.error('AuthContext 초기화 오류:', err);
      } finally {
        setLoading(false);
        console.log('AuthContext: 초기화 완료');
      }
    };

    initializeAuth();

    // 인증 상태 변경 구독
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: string, session: Session | null) => {
      console.log('Auth state changed:', event, session ? 'session exists' : 'no session');
      
      // 세션 캐시 업데이트
      if (session) {
        sessionCache.current = {
          session,
          timestamp: Date.now(),
          expiresIn: 30000
        };
      } else {
        sessionCache.current = {
          session: null,
          timestamp: 0,
          expiresIn: 30000
        };
      }
      
      if (session?.user) {
        console.log('새 세션 사용자:', session.user.id);
        setUser(session.user);
        
        // 관리자 여부 확인
        const isUserAdmin = session.user.email === ADMIN_EMAIL;
        setIsAdmin(isUserAdmin);
        console.log('관리자 여부:', isUserAdmin);
        
        // 관리자가 아닌 경우에만 프로필 확인
        if (!isUserAdmin) {
          await debouncedFetchProfile.current(session.user.id);
        } else {
          // 관리자는 온보딩이 필요없음
          setHasCompletedOnboarding(true);
        }
      } else {
        console.log('세션 종료됨');
        setUser(null);
        setProfile(null);
        setHasCompletedOnboarding(false);
        setIsAdmin(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 프로필 정보 가져오기
  async function fetchProfile(userId: string) {
    console.log('AuthContext: 사용자 ID로 프로필 조회 시작:', userId);
    
    try {
      console.log('프로필 쿼리 정보:', {
        테이블: 'profiles',
        검색필드: 'user_id',
        검색값: userId
      });
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('프로필 조회 오류 발생. 에러 내용:', error);
        
        if (error.code === 'PGRST116') {
          console.log('프로필이 존재하지 않습니다. 새 사용자일 수 있습니다.');
          setProfile(null);
          setHasCompletedOnboarding(false);
          return;
        }
        
        console.error('프로필 조회 중 DB 오류:', error.message);
        setProfile(null);
        setHasCompletedOnboarding(false);
        return;
      }

      if (!data) {
        console.log('프로필 데이터가 없습니다');
        setProfile(null);
        setHasCompletedOnboarding(false);
        return;
      }

      // 필수 필드가 모두 있는지 확인
      const requiredFields = ['student_id', 'grade', 'university', 'department', 'instagram_id', 'avatar_url'];
      const hasAllRequiredFields = requiredFields.every(field => {
        const hasField = data[field] !== null && data[field] !== undefined && data[field] !== '';
        console.log(`필드 체크 - ${field}:`, hasField, '값:', data[field]);
        return hasField;
      });

      console.log('프로필 조회 성공. 데이터:', data);
      console.log('필수 필드 모두 존재?', hasAllRequiredFields);
      
      setProfile(data);
      setHasCompletedOnboarding(hasAllRequiredFields);
      
      if (!hasAllRequiredFields) {
        console.log('일부 필수 필드가 없어 온보딩이 필요합니다.');
      }
    } catch (err) {
      console.error('프로필 조회 중 예외 발생:', err);
      setProfile(null);
      setHasCompletedOnboarding(false);
    }
  }

  // 로그인
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // 회원가입
  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // 로그아웃
  const signOut = async () => {
    try {
      console.log('로그아웃 시작: 로컬 스토리지 정리');
      
      // 로컬 스토리지의 사용자 관련 데이터 삭제
      localStorage.removeItem('onboardingProfile');
      localStorage.removeItem('profile');
      localStorage.removeItem('idealType');
      localStorage.removeItem('communityPosts');
      localStorage.removeItem('supabase.auth.token');
      
      // 사용자별 닉네임 정보 삭제
      if (user?.id) {
        localStorage.removeItem(`userNickname_${user.id}`);
      }
      
      // 모든 supabase 관련 항목 삭제
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('supabase.') || key.includes('supabase'))) {
          console.log('삭제 중인 localStorage 항목:', key);
          localStorage.removeItem(key);
        }
      }
      
      console.log('로컬 스토리지 정리 완료, Supabase 로그아웃 시작');
      
      // 세션 캐시 초기화
      sessionCache.current = {
        session: null,
        timestamp: 0,
        expiresIn: 30000
      };
      
      // Supabase 로그아웃
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase 로그아웃 오류:', error);
        throw error;
      }
      
      console.log('로그아웃 완료');
    } catch (error) {
      console.error('로그아웃 중 오류 발생:', error);
      // 실패하더라도 사용자 상태는 정리
      setUser(null);
      setProfile(null);
    }
  };

  // 프로필 업데이트
  const updateProfile = async (profileData: Partial<Profile>) => {
    try {
      if (!user) throw new Error('No user');

      console.log('프로필 업데이트 시작');
      
      const { error } = await supabase
        .from('profiles')
        .upsert(
          { 
            ...profileData,
            user_id: user.id, 
            updated_at: new Date().toISOString() 
          },
          { 
            onConflict: 'user_id',
            ignoreDuplicates: false
          }
        );

      if (error) {
        console.error('프로필 업데이트 오류:', error);
        return { error };
      }

      // 프로필 상태 업데이트
      await debouncedFetchProfile.current(user.id);
      
      console.log('프로필 업데이트 성공');
      return { error: null };
    } catch (error) {
      console.error('프로필 업데이트 오류:', error);
      return { error: error as Error };
    }
  };

  const value = {
    user,
    profile,
    loading,
    hasCompletedOnboarding,
    isAdmin,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 