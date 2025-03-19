'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientSupabaseClient } from '@/utils/supabase';

export default function Login() {
  const router = useRouter();
  const supabase = createClientSupabaseClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [sessionChecked, setSessionChecked] = useState(false);

  // 페이지 로드 시 세션 확인 (불필요한 로그인 시도 방지)
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // 이미 로그인된 경우 적절한 페이지로 리다이렉트
          console.log('이미 로그인됨, 리다이렉트 중...');
          
          // 관리자 계정인 경우
          if (session.user?.email === 'notify@smartnewb.com') {
            router.push('/admin/community');
            return;
          }
          
          // 일반 사용자인 경우
          router.push('/home');
          return;
        }
        setSessionChecked(true);
      } catch (error) {
        console.error('세션 확인 오류:', error);
        setSessionChecked(true);
      }
    };
    
    checkSession();
  }, [supabase, router]);

  // 요청 제한 오류 발생 시 대기 시간
  const getRetryDelay = () => {
    return Math.min(1000 * Math.pow(2, retryCount), 10000); // 최대 10초
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loading) return; // 이미 요청 중인 경우 중복 요청 방지
    
    setError(null);
    setLoading(true);
    console.log('로그인 시도 중...', { email });

    // 먼저 API 접근 권한 확인
    try {
      const testResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`,
        {
          method: 'GET',
          headers: {
            'apiKey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('API 접근 확인 상태:', testResponse.status);
      
      if (testResponse.status === 404) {
        console.log('API 접근 가능 (404는 정상, 엔드포인트가 존재함을 의미)');
      } else if (testResponse.status === 401) {
        console.error('API 키 인증 실패');
        setError('서버 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요.');
        setLoading(false);
        return;
      }
    } catch (testErr) {
      console.error('API 연결 테스트 실패:', testErr);
      // 테스트 실패해도 로그인 시도는 계속
    }

    try {
      console.log('로그인 요청 시작');
      console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.log('API 키 유무:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('로그인 오류:', error);
        console.log('오류 세부 정보:', { 
          message: error.message, 
          status: error.status, 
          name: error.name,
          code: (error as any).code ?? '코드 없음'
        });
        
        setError(`로그인 실패: ${error.message}`);
        setLoading(false);
        return;
      }

      // 로그인 성공
      console.log('로그인 성공:', { user: data?.user?.id });
      
      // 페이지 이동 전 짧은 지연을 두어 세션이 저장되도록 함
      setTimeout(() => {
        console.log('홈 페이지로 리다이렉션 중...');
        router.push('/home');
      }, 500); // 지연 시간 증가
    } catch (err) {
      console.error('로그인 중 예외 발생:', err);
      setError('로그인 중 오류가 발생했습니다. 네트워크 연결을 확인해주세요.');
      setLoading(false);
    }
  };

  // 세션 확인 중인 경우 로딩 표시
  if (!sessionChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-lg text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm">
        {/* 로고 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-DEFAULT">Project-Solo</h1>
          <p className="text-gray-600 mt-2">나의 이상형을 찾아서</p>
        </div>

        {/* 로그인 폼 */}
        <div className="card space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                이메일
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="이메일을 입력하세요"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="비밀번호를 입력하세요"
                required
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              className="btn-primary w-full"
              disabled={loading}
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <div className="text-center">
            <Link 
              href="/signup" 
              className="text-primary-DEFAULT hover:text-primary-dark text-sm"
            >
              회원가입
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
