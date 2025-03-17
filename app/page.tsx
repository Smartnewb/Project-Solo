'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function Login() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
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
        setError('이메일 또는 비밀번호가 올바르지 않습니다.');
        setLoading(false);
        return;
      }

      // 로그인 성공
      console.log('로그인 성공. 세션 정보:', data.session);
      
      // 명시적으로 홈 페이지로 리다이렉션
      console.log('홈 페이지로 리다이렉션 중...');
      
      // 로컬 스토리지에 데이터 저장을 위한 지연
      setTimeout(() => {
        router.push('/home');
      }, 500);
    } catch (err) {
      console.error('로그인 중 예외 발생:', err);
      setError('로그인 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

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
