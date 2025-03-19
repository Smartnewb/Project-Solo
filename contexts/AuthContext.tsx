'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthError } from '@supabase/supabase-js';
import { createClientSupabaseClient } from '@/utils/supabase';
import { Profile } from '@/types';

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  hasCompletedOnboarding: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (profile: Partial<Profile>) => Promise<{ error: Error | null }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const supabase = createClientSupabaseClient();

  useEffect(() => {
    // 초기 사용자 세션 확인
    const initializeAuth = async () => {
      try {
        console.log('AuthContext: 초기화 시작');
        setLoading(true);
        
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Session check result:', session ? 'Session exists' : 'No session');
        
        if (session?.user) {
          console.log('세션에서 사용자 발견:', session.user.id);
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          console.log('사용자 세션이 없음');
          setUser(null);
          setProfile(null);
          setHasCompletedOnboarding(false);
        }
      } catch (error) {
        console.error('인증 초기화 오류:', error);
        setUser(null);
        setProfile(null);
        setHasCompletedOnboarding(false);
      } finally {
        setLoading(false);
        console.log('AuthContext: 초기화 완료');
      }
    };

    initializeAuth();

    // 인증 상태 변경 구독
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session ? 'session exists' : 'no session');
      
      if (session?.user) {
        console.log('새 세션 사용자:', session.user.id);
        setUser(session.user);
        await fetchProfile(session.user.id);
      } else {
        console.log('세션 종료됨');
        setUser(null);
        setProfile(null);
        setHasCompletedOnboarding(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 프로필 정보 가져오기
  const fetchProfile = async (userId: string) => {
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
  };

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
      console.log('업데이트할 데이터:', profileData);
      console.log('사용자 ID:', user.id);

      // 업데이트할 데이터에서 user_id 필드 제외
      const updateData = { ...profileData };
      delete (updateData as any).user_id;

      // upsert 연산 수행
      const { data: upsertedProfile, error } = await supabase
        .from('profiles')
        .upsert(
          {
            user_id: user.id, // upsert의 기준이 되는 필드
            ...updateData,
            updated_at: new Date().toISOString(),
            created_at: new Date().toISOString(), // 새로 생성되는 경우에만 사용됨
          },
          {
            onConflict: 'user_id', // user_id가 충돌하는 경우 업데이트
            ignoreDuplicates: false, // 중복을 무시하지 않고 업데이트
          }
        )
        .select()
        .single();

      if (error) {
        console.error('프로필 upsert 실패:', error);
        throw error;
      }

      console.log('프로필 upsert 성공:', upsertedProfile);
      
      // 프로필 새로고침
      await fetchProfile(user.id);

      return { error: null };
    } catch (error) {
      console.error('프로필 업데이트 중 예외 발생:', error);
      return { error: error as Error };
    }
  };

  const value = {
    user,
    profile,
    loading,
    hasCompletedOnboarding,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 