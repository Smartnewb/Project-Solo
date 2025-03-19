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
    console.log('로그인 시도 중...');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('로그인 오류:', error);
        
        // 요청 제한 오류 처리
        if (error.message === 'Request rate limit reached' && retryCount < 3) {
          setRetryCount(prev => prev + 1);
          const delay = getRetryDelay();
          setError(`요청 제한에 도달했습니다. ${delay/1000}초 후 자동으로 재시도합니다...`);
          
          setTimeout(() => {
            console.log(`${delay/1000}초 후 로그인 재시도...`);
            setLoading(false);
            handleLogin(e);
          }, delay);
          return;
        }

        // 다른 오류 처리
        if (error.message === 'Request rate limit reached') {
          setError('요청 횟수가 너무 많습니다. 잠시 후 다시 시도해주세요.');
        } else {
          setError('이메일 또는 비밀번호가 올바르지 않습니다.');
        }
        setLoading(false);
        return;
      }

      // 로그인 성공
      console.log('로그인 성공');
      setRetryCount(0); // 성공 시 재시도 카운트 초기화
      
      // 명시적으로 홈 페이지로 리다이렉션
      console.log('홈 페이지로 리다이렉션 중...');
      
      // 지연없이 바로 리다이렉션
      router.push('/home');
    } catch (err) {
      console.error('로그인 중 예외 발생:', err);
      setError('로그인 중 오류가 발생했습니다.');
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
