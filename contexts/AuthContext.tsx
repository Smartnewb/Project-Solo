'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import axiosServer from '@/utils/axios';
import {
  setStoredAdminRefreshToken,
} from '@/shared/auth/admin-auth-contract';

export type User = {
  id: string;
  email: string;
  role: string;
};

export type Profile = {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  avatar_url?: string;
  gender?: 'male' | 'female' | string;
  interests?: string[];
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
  syncExternalAuth: (user: User, isAdmin: boolean) => void;
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
    // 토큰 만료 시간을 1시간에서 8시간으로 연장 (8시간 = 28800초)
    document.cookie = `accessToken=${token}; path=/; max-age=28800; SameSite=Lax`;
  };
  const removeAccessToken = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('isAdmin');
    document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  };

  // 프로필 조회
  const fetchProfile = async (): Promise<void> => {
    try {
      const token = getAccessToken();
      if (!token) return;

      const response = await axiosServer.get('/profile');

      console.log('받아온 프로필 데이터:', response.data);
      setState(prev => ({ ...prev, profile: response.data }));

      // 상태 업데이트 후 최종 상태 확인
      console.log('저장된 프로필 상태:', state.profile);
    } catch (error) {
      console.error('프로필 조회 중 오류:', error);

      // 401 에러 처리
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        const refreshSuccess = await refreshAccessToken();
        if (!refreshSuccess) {
          await signOut();
          return;
        }
        return await fetchProfile();
      }

      setState(prev => ({ ...prev, profile: null }));
    }
  };

  // 토큰 갱신
  const refreshAccessToken = async (): Promise<boolean> => {
    try {
      const refreshToken = localStorage.getItem('admin_refresh_token');
      const response = await axiosServer.post('/auth/refresh', {
        refreshToken: refreshToken || undefined,
      });

      setAccessToken(response.data.accessToken);
      if (response.data.refreshToken) {
        setStoredAdminRefreshToken(response.data.refreshToken);
      }
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
      const response = await axiosServer.post('/auth/login', {
        email,
        password
      });

      const data = response.data;

      if (!data.accessToken) {
        throw new Error('토큰이 없습니다.');
      }

      // 토큰 저장
      setAccessToken(data.accessToken);
      setStoredAdminRefreshToken(data.refreshToken);

      // 사용자 정보 설정
      const userInfo = data.user || data;

      // roles 배열 또는 role 문자열 모두 지원
      const roles = userInfo.roles || (userInfo.role ? [userInfo.role] : []);
      const isAdmin = Array.isArray(roles) ? roles.includes('admin') : roles === 'admin';

      // 사용자 정보 및 관리자 여부 저장
      localStorage.setItem('user', JSON.stringify(userInfo));
      localStorage.setItem('isAdmin', isAdmin ? 'true' : 'false');

      setState(prev => ({
        ...prev,
        user: userInfo,
        isAdmin: isAdmin,
        loading: false
      }));

      // 프로필 정보 조회
      await fetchProfile();

      // 어드민 쿠키 세션 설정 (AdminShell이 쿠키 기반 인증 사용)
      if (isAdmin) {
        await fetch('/api/admin/auth/establish-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            selectedCountry: 'kr',
          }),
        });
      }

      // 리다이렉트
      router.push(isAdmin ? '/admin/dashboard' : '/home');
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }));

      // 에러 메시지 추출 및 전달
      if (axios.isAxiosError(error) && error.response?.data) {
        throw new Error(error.response.data.message || error.response.data.error || '로그인에 실패했습니다.');
      }
      throw error;
    }
  };

  // 로그아웃
   const signOut = async () => {
    console.log('로그아웃 시작');
    setState(prev => ({ ...prev, loading: true }));
    try {
      localStorage.clear();
      removeAccessToken();
      setStoredAdminRefreshToken(null);
    } catch (error) {
      console.error('로그아웃 중 오류 발생:', error);
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
      // localStorage에서 사용자 정보 복원
      const storedUser = localStorage.getItem('user');
      const storedIsAdmin = localStorage.getItem('isAdmin') === 'true';
      
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setState(prev => ({
            ...prev,
            user: userData,
            isAdmin: storedIsAdmin,
            loading: false
          }));
          console.log('저장된 사용자 정보 복원 성공:', userData);
        } catch (parseError) {
          console.error('사용자 정보 파싱 실패:', parseError);
          throw new Error('저장된 사용자 정보 손상');
        }
      } else {
        throw new Error('저장된 사용자 정보 없음');
      }

      await fetchProfile();
    } catch (error) {
      console.error('인증 초기화 오류:', error);
      await signOut();
    }
  };

  // 외부 인증 상태 동기화 (LegacyAuthBridge에서 호출)
  const syncExternalAuth = (user: User, isAdmin: boolean) => {
    setState(prev => ({ ...prev, user, isAdmin, loading: false }));
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
    fetchProfile,
    syncExternalAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
