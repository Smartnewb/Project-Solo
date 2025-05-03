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

  // JWT 토큰에서 사용자 ID 추출
  const extractUserIdFromToken = (token: string): string => {
    try {
      // JWT 토큰은 header.payload.signature 형식
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('유효하지 않은 JWT 토큰 형식');
        return '';
      }

      // Base64 디코딩
      const payload = JSON.parse(atob(parts[1]));
      console.log('토큰 페이로드:', payload);

      // 페이로드에서 ID 추출
      return payload.id || '';
    } catch (error) {
      console.error('토큰 디코딩 중 오류:', error);
      return '';
    }
  };

  // 토큰 관리 함수들
  const getAccessToken = () => {
    try {
      // 먼저 localStorage에서 토큰 가져오기 시도
      const localToken = localStorage.getItem('admin_access_token');

      // localStorage에 토큰이 있으면 반환
      if (localToken) {
        console.log('localStorage에서 어드민 토큰 발견');
        return localToken;
      }

      // localStorage에 토큰이 없으면 쿠키에서 가져오기 시도
      if (typeof document !== 'undefined') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i].trim();
          if (cookie.startsWith('admin_access_token=')) {
            const cookieToken = cookie.substring('admin_access_token='.length);
            console.log('쿠키에서 어드민 토큰 발견');

            // 쿠키에서 발견한 토큰을 localStorage에도 저장
            try {
              localStorage.setItem('admin_access_token', cookieToken);
            } catch (storageError) {
              console.error('쿠키에서 가져온 토큰을 localStorage에 저장 실패:', storageError);
            }

            return cookieToken;
          }
        }
      }

      console.log('어드민 토큰을 찾을 수 없음');
      return null;
    } catch (error) {
      console.error('토큰 가져오기 실패:', error);
      return null;
    }
  };

  const setAccessToken = (token: string) => {
    try {
      // localStorage에 저장
      localStorage.setItem('admin_access_token', token);
      console.log('localStorage에 어드민 토큰 저장 완료');

      // 쿠키에도 저장 (8시간 = 28800초)
      try {
        // 보안 강화를 위한 쿠키 옵션 설정
        const secure = window.location.protocol === 'https:' ? '; Secure' : '';
        document.cookie = `admin_access_token=${token}; path=/; max-age=28800; SameSite=Lax${secure}`;
        console.log('쿠키에 어드민 토큰 저장 완료');
      } catch (cookieError) {
        console.error('쿠키에 토큰 저장 실패:', cookieError);
      }

      // sessionStorage에도 저장 (브라우저 탭 닫을 때까지만 유지)
      try {
        sessionStorage.setItem('admin_access_token', token);
        console.log('sessionStorage에 어드민 토큰 저장 완료');
      } catch (sessionError) {
        console.error('sessionStorage에 토큰 저장 실패:', sessionError);
      }
    } catch (error) {
      console.error('토큰 저장 실패:', error);
    }
  };

  const removeAccessToken = () => {
    try {
      // localStorage에서 제거
      localStorage.removeItem('admin_access_token');
      console.log('localStorage에서 어드민 토큰 제거 완료');

      // 쿠키에서도 제거
      try {
        document.cookie = 'admin_access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        console.log('쿠키에서 어드민 토큰 제거 완료');
      } catch (cookieError) {
        console.error('쿠키에서 토큰 제거 실패:', cookieError);
      }

      // sessionStorage에서도 제거
      try {
        sessionStorage.removeItem('admin_access_token');
        console.log('sessionStorage에서 어드민 토큰 제거 완료');
      } catch (sessionError) {
        console.error('sessionStorage에서 토큰 제거 실패:', sessionError);
      }
    } catch (error) {
      console.error('토큰 제거 실패:', error);
    }
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

        // 토큰 갱신 후 사용자 정보 업데이트
        const userInfo: AdminUser = {
          id: extractUserIdFromToken(response.data.accessToken),
          email: state.user?.email || '',
          role: 'ADMIN'
        };

        setState(prev => ({
          ...prev,
          user: userInfo,
          isAuthenticated: true
        }));

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

      console.log('어드민 로그인 응답 상태:', response.status);
      console.log('어드민 로그인 응답 데이터:', response.data);

      const data = response.data;

      // 응답 데이터 검증
      if (!data) {
        throw new Error('로그인 응답 데이터가 없습니다.');
      }

      if (!data.accessToken) {
        throw new Error('토큰이 없습니다.');
      }

      // 토큰 저장
      setAccessToken(data.accessToken);

      // 토큰에서 사용자 정보 추출
      const userId = extractUserIdFromToken(data.accessToken);

      if (!userId) {
        console.warn('토큰에서 사용자 ID를 추출할 수 없습니다. 대체 ID를 사용합니다.');
      }

      // 사용자 정보 생성
      const userInfo: AdminUser = {
        id: userId || 'unknown-id',
        email: email, // 로그인 요청에서 이메일 사용
        role: data.role || 'ADMIN' // 응답에 role이 있으면 사용, 없으면 'ADMIN' 하드코딩
      };

      console.log('어드민 사용자 정보 설정:', userInfo);

      // 상태 업데이트
      setState(prev => ({
        ...prev,
        user: userInfo,
        isAuthenticated: true,
        loading: false
      }));

      // 사용자 정보 확인 API 호출 (선택적)
      try {
        const checkResponse = await axios.post(`${apiUrl}/api/admin/auth/check`, {}, {
          headers: {
            'Authorization': `Bearer ${data.accessToken}`
          },
          withCredentials: true
        });

        console.log('사용자 정보 확인 응답:', checkResponse.data);

        // 응답에 추가 사용자 정보가 있으면 상태 업데이트
        if (checkResponse.data && typeof checkResponse.data === 'object') {
          const updatedUserInfo = {
            ...userInfo,
            ...checkResponse.data
          };

          setState(prev => ({
            ...prev,
            user: updatedUserInfo
          }));

          console.log('사용자 정보 업데이트됨:', updatedUserInfo);
        }
      } catch (checkError) {
        console.warn('사용자 정보 확인 API 호출 실패:', checkError);
        // 실패해도 로그인 프로세스는 계속 진행
      }

      // 리다이렉트
      console.log('어드민 대시보드로 리다이렉트 준비 중...');

      // Next.js router를 사용하여 리다이렉트
      try {
        console.log('어드민 대시보드로 리다이렉트 실행');
        router.replace('/admin/dashboard');
      } catch (redirectError) {
        console.error('리다이렉트 중 오류 발생:', redirectError);
      }
    } catch (error) {
      console.error('어드민 로그인 오류 상세:', error);

      if (axios.isAxiosError(error)) {
        console.error('API 오류 상태:', error.response?.status);
        console.error('API 오류 데이터:', error.response?.data);
      }

      setState(prev => ({ ...prev, loading: false }));

      // 에러 메시지 추출 및 전달
      if (axios.isAxiosError(error) && error.response?.data) {
        const errorMessage =
          error.response.data.message ||
          error.response.data.error ||
          '어드민 로그인에 실패했습니다.';

        throw new Error(errorMessage);
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
    console.log('어드민 인증 초기화 시작');
    setState(prev => ({ ...prev, loading: true }));

    try {
      // 여러 저장소에서 토큰 가져오기 시도
      const token = getAccessToken();

      if (!token) {
        console.log('저장된 어드민 토큰이 없습니다.');
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

      console.log('저장된 어드민 토큰 발견');

      // 토큰 유효성 검증 (JWT 형식 확인)
      try {
        // JWT 형식 검증 (간단한 형식 검증만 수행)
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
          console.error('유효하지 않은 JWT 형식');
          throw new Error('유효하지 않은 JWT 형식');
        }

        // 토큰 만료 시간 확인
        const payload = JSON.parse(atob(tokenParts[1]));
        const expiryTime = payload.exp * 1000; // 초를 밀리초로 변환
        const currentTime = Date.now();

        console.log('토큰 만료 시간:', new Date(expiryTime).toLocaleString());
        console.log('현재 시간:', new Date(currentTime).toLocaleString());

        if (expiryTime <= currentTime) {
          console.warn('토큰이 만료되었습니다. 갱신 시도 중...');
          const refreshSuccess = await refreshToken();
          if (!refreshSuccess) {
            throw new Error('만료된 토큰 갱신 실패');
          }
          // 갱신된 토큰 가져오기
          const newToken = getAccessToken();
          if (!newToken) {
            throw new Error('갱신된 토큰이 없습니다.');
          }
          // 갱신된 토큰으로 계속 진행
          console.log('토큰 갱신 성공, 갱신된 토큰으로 계속 진행');
        }
      } catch (tokenError) {
        console.error('토큰 검증 중 오류:', tokenError);
        // 토큰 검증 실패 시 갱신 시도
        console.log('토큰 검증 실패, 갱신 시도 중...');
        const refreshSuccess = await refreshToken();
        if (!refreshSuccess) {
          throw new Error('토큰 검증 실패 및 갱신 실패');
        }
      }

      // 현재 유효한 토큰 (원래 토큰 또는 갱신된 토큰)
      const currentToken = getAccessToken();
      if (!currentToken) {
        throw new Error('유효한 토큰이 없습니다.');
      }

      // 사용자 정보 가져오기
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8045';
        console.log('사용자 정보 요청 URL:', `${apiUrl}/api/admin/auth/check`);

        const response = await axios.post(`${apiUrl}/api/admin/auth/check`, {}, {
          headers: {
            'Authorization': `Bearer ${currentToken}`
          },
          withCredentials: true
        });

        console.log('어드민 사용자 정보 응답:', response.data);

        // 토큰에서 사용자 ID 추출
        const userId = extractUserIdFromToken(currentToken);

        // 사용자 정보 생성
        const userInfo: AdminUser = {
          id: userId || 'unknown-id',
          email: response.data?.email || '',
          role: response.data?.role || 'ADMIN'
        };

        console.log('어드민 사용자 정보 설정:', userInfo);

        // 토큰 재저장 (여러 저장소에 동기화)
        setAccessToken(currentToken);

        setState(prev => ({
          ...prev,
          user: userInfo,
          isAuthenticated: true,
          loading: false
        }));

        console.log('어드민 인증 초기화 성공');
      } catch (userError) {
        console.error('어드민 사용자 정보 가져오기 실패:', userError);

        // API 오류 코드 확인
        if (axios.isAxiosError(userError) && userError.response) {
          const statusCode = userError.response.status;

          // 401 또는 403 오류인 경우 토큰 갱신 시도
          if (statusCode === 401 || statusCode === 403) {
            console.log('인증 오류 (401/403), 토큰 갱신 시도 중...');
            const refreshSuccess = await refreshToken();

            if (!refreshSuccess) {
              console.error('어드민 토큰 갱신 실패');
              throw new Error('어드민 토큰 갱신 실패');
            }

            console.log('토큰 갱신 성공, 사용자 정보 다시 요청 중...');

            // 토큰 갱신 후 다시 사용자 정보 요청
            const newToken = getAccessToken();
            if (!newToken) {
              throw new Error('갱신된 토큰이 없습니다.');
            }

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8045';
            const response = await axios.post(`${apiUrl}/api/admin/auth/check`, {}, {
              headers: {
                'Authorization': `Bearer ${newToken}`
              },
              withCredentials: true
            });

            console.log('갱신된 토큰으로 사용자 정보 응답:', response.data);

            // 토큰에서 사용자 ID 추출
            const userId = extractUserIdFromToken(newToken);

            // 사용자 정보 생성
            const userInfo: AdminUser = {
              id: userId || 'unknown-id',
              email: response.data?.email || '',
              role: response.data?.role || 'ADMIN'
            };

            console.log('갱신된 토큰으로 사용자 정보 설정:', userInfo);

            setState(prev => ({
              ...prev,
              user: userInfo,
              isAuthenticated: true,
              loading: false
            }));

            console.log('어드민 인증 초기화 성공 (토큰 갱신 후)');
          } else {
            // 다른 API 오류인 경우
            throw new Error(`API 오류: ${statusCode}`);
          }
        } else {
          // 네트워크 오류 등 다른 오류인 경우
          throw userError;
        }
      }
    } catch (error) {
      console.error('어드민 인증 초기화 오류:', error);

      // 오류 발생 시 로그아웃 처리
      console.log('인증 오류로 인한 로그아웃 처리');
      removeAccessToken();

      setState({
        user: null,
        loading: false,
        isAuthenticated: false
      });
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
