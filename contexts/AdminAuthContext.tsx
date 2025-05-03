'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export type AdminUser = {
  id: string;
  email: string;
  role: string;
};

interface AdminAuthState {
  user: AdminUser | null;
  loading: boolean;
  isAuthenticated: boolean;
}

interface AdminAuthContextType extends AdminAuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const [state, setState] = useState<AdminAuthState>({
    user: null,
    loading: true,
    isAuthenticated: false
  });

  // 토큰 관리 함수들
  const getAccessToken = () => localStorage.getItem('admin_access_token');
  const setAccessToken = (token: string) => {
    localStorage.setItem('admin_access_token', token);
    document.cookie = `admin_access_token=${token}; path=/; max-age=28800; SameSite=Lax`;
  };
  const removeAccessToken = () => {
    localStorage.removeItem('admin_access_token');
    document.cookie = 'admin_access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  };

  // 토큰 갱신
  const refreshToken = async (): Promise<boolean> => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8045';
      console.log('토큰 갱신 요청 URL:', `${apiUrl}/api/admin/auth/refresh`);

      // 쿠키에서 리프레시 토큰을 가져오는 대신 백엔드 API 요구사항에 맞게 요청 바디에 포함
      // 백엔드에서는 쿠키에서 토큰을 가져오므로 빈 객체를 보내도 됨
      const response = await axios.post(`${apiUrl}/api/admin/auth/refresh`, {}, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('토큰 갱신 응답:', response.status);

      if (response.data && response.data.accessToken) {
        setAccessToken(response.data.accessToken);
        return true;
      } else {
        console.error('토큰 갱신 응답에 accessToken이 없습니다:', response.data);
        return false;
      }
    } catch (error) {
      console.error('어드민 토큰 갱신 실패:', error);
      return false;
    }
  };

  // 어드민 로그인
  const login = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      console.log('어드민 로그인 시도:', { email });
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8045';
      console.log('API URL:', apiUrl);

      // API 요청 전 로깅
      console.log('어드민 로그인 API 요청 URL:', `${apiUrl}/api/admin/auth/login`);

      // 요청 설정
      const config = {
        withCredentials: true, // 쿠키 전송을 위해 필요
        headers: {
          'Content-Type': 'application/json'
        }
      };

      // 로그인 요청
      const response = await axios.post(`${apiUrl}/api/admin/auth/login`, {
        email,
        password
      }, config);

      console.log('어드민 로그인 응답:', response.status);
      const data = response.data;
      console.log('어드민 로그인 데이터:', {
        hasToken: !!data.accessToken,
        hasUser: !!data.user
      });

      if (!data.accessToken) {
        throw new Error('토큰이 없습니다.');
      }

      // 토큰 저장
      setAccessToken(data.accessToken);
      console.log('어드민 토큰 저장 완료:', data.accessToken.substring(0, 10) + '...');

      // 사용자 정보 설정
      const userInfo = data.user || data;

      console.log('어드민 사용자 정보:', {
        id: userInfo.id,
        email: userInfo.email,
        role: userInfo.role
      });

      setState(prev => ({
        ...prev,
        user: userInfo,
        isAuthenticated: true,
        loading: false
      }));

      // 리다이렉트
      console.log('어드민 대시보드로 리다이렉트 준비 중...');

      // Next.js router를 사용하여 리다이렉트
      try {
        console.log('어드민 대시보드로 리다이렉트 실행');

        // Next.js router.replace를 사용하여 현재 페이지를 완전히 대체
        router.replace('/admin/dashboard');
      } catch (redirectError) {
        console.error('리다이렉트 중 오류 발생:', redirectError);
      }
    } catch (error) {
      console.error('어드민 로그인 오류 상세:', error);

      if (axios.isAxiosError(error)) {
        console.error('API 오류 상태:', error.response?.status);
        console.error('API 오류 데이터:', error.response?.data);
        console.error('API 오류 헤더:', error.response?.headers);
      }

      setState(prev => ({ ...prev, loading: false }));

      // 에러 메시지 추출 및 전달
      if (axios.isAxiosError(error) && error.response?.data) {
        throw new Error(error.response.data.message || error.response.data.error || '어드민 로그인에 실패했습니다.');
      }
      throw error;
    }
  };

  // 로그아웃
  const logout = async () => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      // 로그아웃 API 호출 (선택적)
      try {
        const token = getAccessToken();
        if (token) {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8045';
          console.log('로그아웃 요청 URL:', `${apiUrl}/api/admin/auth/logout`);

          await axios.post(`${apiUrl}/api/admin/auth/logout`, {}, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            withCredentials: true // 쿠키 전송을 위해 필요
          });
        }
      } catch (logoutError) {
        console.error('어드민 로그아웃 API 호출 오류:', logoutError);
        // 로그아웃 API 호출 실패해도 계속 진행
      }

      // 로컬 상태 및 토큰 정리
      removeAccessToken();
      setState({
        user: null,
        loading: false,
        isAuthenticated: false
      });

      // 로그인 페이지로 리다이렉트
      router.push('/');
    } catch (error) {
      console.error('어드민 로그아웃 중 오류 발생:', error);
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
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8045';
        console.log('사용자 정보 요청 URL:', `${apiUrl}/api/admin/auth/check`);

        const response = await axios.post(`${apiUrl}/api/admin/auth/check`, {}, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          withCredentials: true // 쿠키 전송을 위해 필요
        });

        const userData = response.data;

        setState(prev => ({
          ...prev,
          user: userData,
          isAuthenticated: true,
          loading: false
        }));

        console.log('어드민 사용자 정보 가져오기 성공:', userData);
      } catch (userError) {
        console.error('어드민 사용자 정보 가져오기 실패:', userError);

        // 토큰이 유효하지 않은 경우 토큰 갱신 시도
        const refreshSuccess = await refreshToken();
        if (!refreshSuccess) {
          throw new Error('어드민 토큰 갱신 실패');
        }

        // 토큰 갱신 후 다시 사용자 정보 요청
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8045';
        console.log('토큰 갱신 후 사용자 정보 요청 URL:', `${apiUrl}/api/admin/auth/check`);

        const response = await axios.post(`${apiUrl}/api/admin/auth/check`, {}, {
          headers: {
            'Authorization': `Bearer ${getAccessToken()}`
          },
          withCredentials: true // 쿠키 전송을 위해 필요
        });

        const userData = response.data;

        setState(prev => ({
          ...prev,
          user: userData,
          isAuthenticated: true,
          loading: false
        }));
      }
    } catch (error) {
      console.error('어드민 인증 초기화 오류:', error);
      await logout();
    }
  };

  // 초기화
  useEffect(() => {
    initAuth();
  }, []);

  const value: AdminAuthContextType = {
    ...state,
    login,
    logout,
    refreshToken
  };

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};
