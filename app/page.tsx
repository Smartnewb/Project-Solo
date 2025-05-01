'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

export default function AdminLogin() {
  const { login, user, loading } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // 백엔드 서버 상태 확인
  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        console.log('백엔드 서버 상태 확인 시작');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8045';
        console.log('API URL:', apiUrl);

        // 여러 엔드포인트 시도
        const endpoints = ['/api/auth/me', '/api/health', '/api'];
        let connected = false;

        for (const endpoint of endpoints) {
          try {
            console.log(`엔드포인트 시도: ${endpoint}`);
            const url = `${apiUrl}${endpoint}`;
            console.log(`전체 URL: ${url}`);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(url, {
              method: 'GET',
              cache: 'no-cache',
              signal: controller.signal,
              // CORS 문제 해결을 위한 추가 옵션
              mode: 'cors',
              credentials: 'include'
            });

            clearTimeout(timeoutId);
            console.log(`서버 응답 (${endpoint}):`, response.status);

            connected = true;
            break;
          } catch (endpointError) {
            console.error(`엔드포인트 ${endpoint} 연결 실패:`, endpointError);
          }
        }

        if (connected) {
          console.log('서버 연결 성공');
          setServerStatus('online');
        } else {
          throw new Error('모든 엔드포인트 연결 실패');
        }
      } catch (error) {
        console.error('서버 연결 확인 중 오류:', error);
        setServerStatus('offline');
        setError('백엔드 서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
      }
    };

    checkServerStatus();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    // 서버 상태가 오프라인인 경우
    if (serverStatus === 'offline') {
      setError('백엔드 서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      console.log('어드민 로그인 시도 중...', { email: email.trim() });

      // 서버 상태 재확인
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8045';
        console.log('어드민 로그인 전 서버 상태 확인 URL:', `${apiUrl}/api/health`);

        const response = await fetch(`${apiUrl}/api/health`, {
          method: 'GET',
          cache: 'no-cache',
          signal: AbortSignal.timeout(3000), // 3초 타임아웃
          mode: 'cors',
          credentials: 'include'
        });
        console.log('어드민 로그인 전 서버 상태 확인:', response.status);
      } catch (healthError) {
        console.error('어드민 로그인 전 서버 상태 확인 실패:', healthError);
        throw new Error('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
      }

      await login(email.trim(), password);
      console.log('어드민 로그인 성공!');
    } catch (err: any) {
      console.error('어드민 로그인 중 오류:', err);

      // 오류 메시지 설정
      let errorMessage = err.message || '어드민 로그인에 실패했습니다.';

      // 네트워크 오류인 경우
      if (err.message?.includes('Network Error') ||
          err.message?.includes('Failed to fetch') ||
          err.message?.includes('연결할 수 없습니다')) {
        errorMessage = '서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.';
        setServerStatus('offline');
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 로딩 상태 표시
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-500">잠시만 기다려주세요...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-800">Admin</h1>
          <p className="text-gray-600 mt-2 text-lg">어드민 로그인</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-gray-700 mb-1 text-base">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                placeholder="이메일을 입력하세요"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-1 text-base">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                placeholder="비밀번호를 입력하세요"
                required
              />
            </div>

            {error && <div className="text-red-500 text-sm">{error}</div>}

            <button
              type="submit"
              className="w-full py-3 px-4 bg-pink-500 hover:bg-pink-600 text-white font-medium rounded-md transition duration-200 text-lg"
              disabled={isLoading}
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          {/* 회원가입 링크 제거 - 어드민 전용 로그인 */}
        </div>

        {/* 회사 정보 추가 */}
        <footer className="mt-8 text-center text-xs text-gray-500 space-y-2">
          <div className="space-x-2">
            <span>상호명: 스마트 뉴비</span>
            <span>|</span>
            <span>대표: 전준영</span>
          </div>
          <div className="space-x-2">
            <span>사업장 소재지: 대전광역시 유성구 동서대로 125, S9동 202호</span>
          </div>
          <div className="space-x-2">
            <span>사업자 등록번호: 498-05-02914</span>
            <span>|</span>
            <span>통신판매업신고: [통신판매업신고번호]</span>
          </div>
          <div className="space-x-2">
            <span>문의전화: 070-8065-4387</span>
            <span>|</span>
            <span>이메일: notify@smartnewb.com</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
