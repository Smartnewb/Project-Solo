'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

export default function AdminLogin() {
  const router = useRouter();
  const { login, user, loading } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [animationTriggered, setAnimationTriggered] = useState(false);

  // 백엔드 서버 상태 확인
  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        console.log('백엔드 서버 상태 확인 시작');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8045';
        console.log('API URL:', apiUrl);

        // 여러 엔드포인트 시도
        const endpoints = ['/api/admin/auth/login', '/api/admin/auth/check', '/api'];
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
        console.log('어드민 로그인 전 서버 상태 확인 URL:', `${apiUrl}/api`);

        const response = await fetch(`${apiUrl}/api`, {
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

      // 로그인 성공 시 애니메이션 트리거
      setAnimationTriggered(true);

      // 애니메이션 후 페이지 이동
      setTimeout(() => {
        router.push('/admin/dashboard');
      }, 2000);

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f111a] p-4 relative overflow-hidden">
      {/* 배경 효과 - 움직이는 그리드 */}
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="grid-background"></div>
      </div>

      {/* 로그인 애니메이션 효과 */}
      {animationTriggered && (
        <>
          <div className="glow-effect"></div>
          <div className="access-granted font-tech">ACCESS GRANTED</div>
        </>
      )}

      {/* 메인 콘텐츠 */}
      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-[#00ffe0] tracking-wider font-tech">SMART NEWBIE</h1>
          <p className="text-gray-300 mt-2 text-lg font-tech">ACCESS CONTROL TOWER</p>
        </div>

        <div className="bg-black/30 backdrop-blur-md rounded-lg border border-[#00ffe0]/20 p-8 space-y-6 shadow-glow">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-gray-300 mb-1 text-base font-tech">NEURAL ID</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <svg className="w-5 h-5 text-[#00ffe0]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"></path>
                  </svg>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 px-4 py-3 rounded-md bg-black/50 border border-[#00ffe0]/30 text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#00ffe0] focus:border-transparent transition-all duration-300"
                  placeholder="Enter Neural ID"
                  required
                  disabled={animationTriggered}
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-300 mb-1 text-base font-tech">ACCESS CODE</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <svg className="w-5 h-5 text-[#00ffe0]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                  </svg>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 px-4 py-3 rounded-md bg-black/50 border border-[#00ffe0]/30 text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#00ffe0] focus:border-transparent transition-all duration-300"
                  placeholder="Input Access Code"
                  required
                  disabled={animationTriggered}
                />
              </div>
            </div>

            {error && <div className="text-red-400 text-sm font-tech">{error}</div>}

            <button
              type="submit"
              className="w-full py-3 px-4 bg-gradient-to-r from-[#00ffe0] to-[#0099ff] text-black font-bold rounded-md transition-all duration-300 hover:shadow-[0_0_15px_rgba(0,255,224,0.7)] text-lg font-tech"
              disabled={isLoading || animationTriggered}
            >
              {isLoading ? 'AUTHENTICATING...' : animationTriggered ? 'ACCESS GRANTED' : 'ENGAGE SYSTEM'}
            </button>
          </form>

          {/* 회원가입 링크 제거 - 어드민 전용 로그인 */}
        </div>

        {/* 시스템 상태 표시 */}
        <div className="mt-4 text-center">
          <p className="text-xs text-[#00ffe0]/70 font-tech">
            SYSTEM STATUS: {serverStatus === 'online' ? 'CONNECTED' : serverStatus === 'offline' ? 'DISCONNECTED' : 'INITIALIZING'}
          </p>
        </div>
      </div>
    </div>
  );
}
