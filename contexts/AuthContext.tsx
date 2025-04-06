'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

export type User = {
  id: string;
  email: string;
  role: string;
};

export type Profile = {
  id: string;
  user_id: string;
  name: string;
  university?: string;
  department?: string;
  student_id?: string;
  grade?: string;
  age?: number;
  height?: number;
  mbti?: string;
  personalities?: string[];
  dating_styles?: string[];
  drinking?: string;
  smoking?: string;
  tattoo?: string;
  instagram_id?: string;
  created_at?: string;
  updated_at?: string;
};

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
  fetchProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    isAdmin: false
  });

  // 토큰 관리 함수들
  const getAccessToken = () => localStorage.getItem('accessToken');
  const setAccessToken = (token: string) => {
    localStorage.setItem('accessToken', token);
    document.cookie = `accessToken=${token}; path=/; max-age=3600; SameSite=Lax`;
  };
  const removeAccessToken = () => {
    localStorage.removeItem('accessToken');
    document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  };

  // 프로필 조회
  const fetchProfile = async () => {
    try {
      const token = getAccessToken();
      if (!token || !state.user) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          const refreshSuccess = await refreshAccessToken();
          if (!refreshSuccess) {
            await signOut();
            return;
          }
          return await fetchProfile();
        }
        throw new Error('프로필 조회 실패');
      }

      const profileData = await response.json();
      console.log('받아온 프로필 데이터:', profileData);
      setState(prev => ({ ...prev, profile: profileData }));
      
      // 상태 업데이트 후 최종 상태 확인
      console.log('저장된 프로필 상태:', state.profile);
    } catch (error) {
      console.error('프로필 조회 중 오류:', error);
      setState(prev => ({ ...prev, profile: null }));
    }
  };

  // 토큰 갱신
  const refreshAccessToken = async (): Promise<boolean> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      setAccessToken(data.accessToken);
      return true;
    } catch (error) {
      console.error('토큰 갱신 실패:', error);
      return false;
    }
  };

  // 로그인
  const login = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '로그인에 실패했습니다.');
      }

      if (!data.accessToken) {
        throw new Error('토큰이 없습니다.');
      }

      // 토큰 저장
      setAccessToken(data.accessToken);

      // 사용자 정보 설정
      const userInfo = data.user || data;
      setState(prev => ({
        ...prev,
        user: userInfo,
        isAdmin: userInfo.role === 'admin',
        loading: false
      }));

      // 프로필 정보 조회
      await fetchProfile();

      // 리다이렉트
      router.push(userInfo.role === 'admin' ? '/admin/community' : '/home');
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }));
      throw error;
    }
  };

  // 로그아웃
  const signOut = async () => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      removeAccessToken();
      setState({
        user: null,
        profile: null,
        loading: false,
        isAdmin: false
      });
      router.push('/');
    } catch (error) {
      console.error('로그아웃 중 오류 발생:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  // 초기 인증 상태 설정
  const initAuth = async () => {
    const token = getAccessToken();
    if (!token) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      // 임시로 토큰이 있으면 인증된 것으로 처리
      setState(prev => ({
        ...prev,
        user: { id: 'temp-id', email: 'temp@email.com', role: 'user' }, // 임시 사용자 정보
        loading: false
      }));

      await fetchProfile();
    } catch (error) {
      console.error('인증 초기화 오류:', error);
      await signOut();
    }
  };

  // 초기화
  useEffect(() => {
    initAuth();
  }, []);

  const value: AuthContextType = {
    ...state,
    login,
    signOut,
    refreshAccessToken,
    fetchProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 