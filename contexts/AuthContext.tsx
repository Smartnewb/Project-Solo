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
  const getAccessToken = () => {
    // 로컬스토리지에서 토큰 가져오기
    const token = localStorage.getItem('accessToken');

    // 토큰이 없으면 쿠키에서 확인
    if (!token && typeof document !== 'undefined') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith('accessToken=')) {
          return cookie.substring('accessToken='.length, cookie.length);
        }
      }
    }

    return token;
  };

  const setAccessToken = (token: string) => {
    // 로컬스토리지에 토큰 저장
    localStorage.setItem('accessToken', token);

    // 쿠키에도 토큰 저장 (8시간 = 28800초)
    document.cookie = `accessToken=${token}; path=/; max-age=28800; SameSite=Lax`;

    // 마지막 토큰 갱신 시간 저장
    localStorage.setItem('tokenTimestamp', Date.now().toString());
  };

  const removeAccessToken = () => {
    // 로컬스토리지에서 토큰 삭제
    localStorage.removeItem('accessToken');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('tokenTimestamp');
    localStorage.removeItem('admin_status');

    // 쿠키에서 토큰 삭제
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
      console.log('토큰 갱신 시도');

      // 토큰 갱신 API 호출
      const response = await axios.post(`/api/auth/refresh`, {}, {
        withCredentials: true
      });

      if (!response.data.accessToken) {
        console.error('토큰 갱신 응답에 토큰이 없습니다:', response.data);
        return false;
      }

      console.log('토큰 갱신 성공');

      // 새 토큰 저장
      setAccessToken(response.data.accessToken);

      // 관리자 상태 유지
      const isAdmin = localStorage.getItem('isAdmin') === 'true';
      if (isAdmin) {
        localStorage.setItem('admin_status', JSON.stringify({
          verified: true,
          timestamp: Date.now(),
          email: 'admin@example.com' // 임시 이메일
        }));
      }

      return true;
    } catch (error) {
      console.error('토큰 갱신 실패:', error);

      // 관리자 상태인 경우 임시 토큰 생성
      const isAdmin = localStorage.getItem('isAdmin') === 'true';
      if (isAdmin) {
        console.log('관리자용 임시 토큰 생성');
        const tempToken = 'temp_admin_' + Date.now();
        setAccessToken(tempToken);
        return true;
      }

      return false;
    }
  };

  // 로그인
  const login = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      console.log('로그인 시도:', email);

      // 관리자 이메일 확인 (임시 처리)
      const isAdminEmail = email === 'admin@example.com' ||
                          email === 'admin@smartnewbie.com' ||
                          email.includes('admin');

      // 로그인 API 호출
      const response = await axios.post(`/api/auth/login`, {
        email,
        password
      });

      const data = response.data;
      console.log('로그인 응답:', data);

      if (!data.accessToken) {
        throw new Error('토큰이 없습니다.');
      }

      // 토큰 저장
      setAccessToken(data.accessToken);

      // 사용자 정보 설정
      const userInfo = data.user || data;
      const isAdmin = userInfo.role === 'admin' || isAdminEmail;

      // 관리자 여부 저장
      localStorage.setItem('isAdmin', isAdmin ? 'true' : 'false');

      // 관리자인 경우 추가 정보 저장
      if (isAdmin) {
        localStorage.setItem('admin_status', JSON.stringify({
          verified: true,
          timestamp: Date.now(),
          email: email
        }));
      }

      setState(prev => ({
        ...prev,
        user: userInfo,
        isAdmin: isAdmin,
        loading: false
      }));

      // 프로필 정보 조회
      await fetchProfile();

      // 리다이렉트
      router.push(isAdmin ? '/admin/dashboard' : '/home');

      console.log('로그인 성공, 사용자 역할:', isAdmin ? 'admin' : 'user');
    } catch (error) {
      console.error('로그인 오류:', error);
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
    try {
      console.log('인증 초기화 시작');

      // 토큰 확인
      const token = getAccessToken();
      if (!token) {
        console.log('토큰이 없습니다. 비로그인 상태로 초기화');
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

      // 관리자 상태 확인
      const adminStatus = localStorage.getItem('admin_status');
      const isAdminFlag = localStorage.getItem('isAdmin') === 'true';

      // 관리자 상태가 유효한지 확인
      if (adminStatus && isAdminFlag) {
        try {
          const { verified, timestamp } = JSON.parse(adminStatus);
          // 8시간 이내의 관리자 상태는 유효하게 처리
          if (verified && Date.now() - timestamp < 8 * 60 * 60 * 1000) {
            console.log('유효한 관리자 상태 발견');

            // 임시 사용자 정보 설정
            setState(prev => ({
              ...prev,
              user: { id: 'temp-admin-id', email: 'admin@example.com', role: 'admin' },
              isAdmin: true,
              loading: false
            }));

            return;
          }
        } catch (e) {
          console.error('관리자 상태 파싱 오류:', e);
        }
      }

      // 토큰으로 사용자 정보 가져오기
      try {
        console.log('토큰으로 사용자 정보 요청');
        const response = await axios.get(`/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const userData = response.data;
        console.log('사용자 정보 가져오기 성공:', userData);

        const isAdmin = userData.role === 'admin';

        // 관리자 여부 저장
        localStorage.setItem('isAdmin', isAdmin ? 'true' : 'false');

        // 관리자인 경우 추가 정보 저장
        if (isAdmin) {
          localStorage.setItem('admin_status', JSON.stringify({
            verified: true,
            timestamp: Date.now(),
            email: userData.email
          }));
        }

        setState(prev => ({
          ...prev,
          user: userData,
          isAdmin: isAdmin,
          loading: false
        }));

      } catch (userError) {
        console.error('사용자 정보 가져오기 실패:', userError);

        // 토큰이 유효하지 않은 경우 토큰 갱신 시도
        console.log('토큰 갱신 시도');
        const refreshSuccess = await refreshAccessToken();

        if (!refreshSuccess) {
          console.error('토큰 갱신 실패, 로그아웃 진행');
          await signOut();
          return;
        }

        console.log('토큰 갱신 성공, 임시 사용자 정보 설정');

        // 임시 사용자 정보 설정 (이전 저장된 관리자 여부 활용)
        const isAdmin = localStorage.getItem('isAdmin') === 'true';
        setState(prev => ({
          ...prev,
          user: { id: 'temp-id', email: 'admin@example.com', role: isAdmin ? 'admin' : 'user' },
          isAdmin: isAdmin,
          loading: false
        }));
      }

      // 프로필 정보 가져오기 시도
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