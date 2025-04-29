'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

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
    // 토큰 만료 시간을 1시간에서 8시간으로 연장 (8시간 = 28800초)
    document.cookie = `accessToken=${token}; path=/; max-age=28800; SameSite=Lax`;
  };
  const removeAccessToken = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('isAdmin');
    document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  };

  // 프로필 조회
  const fetchProfile = async () => {
    try {
      const token = getAccessToken();
      if (!token || !state.user) return;

      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

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
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {}, {
        withCredentials: true
      });

      setAccessToken(response.data.accessToken);
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
      console.log('로그인 시도:', { email });
      console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);

      // API 요청 전 로깅
      console.log('로그인 API 요청 URL:', `${process.env.NEXT_PUBLIC_API_URL}/auth/login`);

      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        email,
        password
      });

      console.log('로그인 응답:', response.status);
      const data = response.data;
      console.log('로그인 데이터:', {
        hasToken: !!data.accessToken,
        hasUser: !!data.user,
        role: data.user?.role || data.role
      });

      if (!data.accessToken) {
        throw new Error('토큰이 없습니다.');
      }

      // 토큰 저장
      setAccessToken(data.accessToken);

      // 사용자 정보 설정
      const userInfo = data.user || data;
      const isAdmin = userInfo.role === 'admin';

      console.log('사용자 정보:', {
        id: userInfo.id,
        email: userInfo.email,
        role: userInfo.role,
        isAdmin
      });

      // 관리자 여부 저장
      localStorage.setItem('isAdmin', isAdmin ? 'true' : 'false');

      setState(prev => ({
        ...prev,
        user: userInfo,
        isAdmin: isAdmin,
        loading: false
      }));

      // 프로필 정보 조회
      await fetchProfile();

      // 리다이렉트
      console.log('리다이렉트 경로:', isAdmin ? '/admin/dashboard' : '/home');
      router.push(isAdmin ? '/admin/dashboard' : '/home');
    } catch (error) {
      console.error('로그인 오류 상세:', error);

      if (axios.isAxiosError(error)) {
        console.error('API 오류 상태:', error.response?.status);
        console.error('API 오류 데이터:', error.response?.data);
        console.error('API 오류 헤더:', error.response?.headers);
      }

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
      // 토큰에서 사용자 정보 추출
      try {
        // 토큰에서 사용자 정보 가져오기 시도
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const userData = response.data;
        const isAdmin = userData.role === 'admin';

        // 관리자 여부 저장
        localStorage.setItem('isAdmin', isAdmin ? 'true' : 'false');

        setState(prev => ({
          ...prev,
          user: userData,
          isAdmin: isAdmin,
          loading: false
        }));

        console.log('사용자 정보 가져오기 성공:', userData);
      } catch (userError) {
        console.error('사용자 정보 가져오기 실패:', userError);

        // 토큰이 유효하지 않은 경우 토큰 갱신 시도
        const refreshSuccess = await refreshAccessToken();
        if (!refreshSuccess) {
          throw new Error('토큰 갱신 실패');
        }

        // 임시 사용자 정보 설정 (이전 저장된 관리자 여부 활용)
        const isAdmin = localStorage.getItem('isAdmin') === 'true';
        setState(prev => ({
          ...prev,
          user: { id: 'temp-id', email: 'admin@example.com', role: isAdmin ? 'admin' : 'user' },
          isAdmin: isAdmin,
          loading: false
        }));
      }

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