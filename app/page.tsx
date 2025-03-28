'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ADMIN_EMAIL } from '@/utils/config';

export default function Login() {
  const router = useRouter();
  const supabase = createClient();
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // AuthContext의 상태 변화 감지
  useEffect(() => {
    if (!authLoading && user) {
      console.log('로그인 상태 감지됨:', user.id);
      if (user.email === ADMIN_EMAIL) {
        router.replace('/admin/community');
      } else {
        router.replace('/home');
      }
    }
  }, [user, authLoading, router]);

  // 로딩 상태 표시
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
          <p className="text-gray-600">인증 상태 확인 중...</p>
        </div>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setError(null);
    setLoading(true);
    console.log('로그인 시도 중...', { email });

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('로그인 오류:', error);
        setError(`로그인 실패: ${error.message}`);
        return;
      }

      // 로그인 성공 시 사용자 정보와 어드민 여부 저장
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        const isAdmin = data.user.email === ADMIN_EMAIL;
        localStorage.setItem('isAdmin', String(isAdmin));
      }

      console.log('로그인 성공:', data.user?.id);
    } catch (err) {
      console.error('로그인 중 예외 발생:', err);
      setError('로그인 중 오류가 발생했습니다. 네트워크 연결을 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        {/* 로고 */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-800">Project-Solo</h1>
          <p className="text-gray-600 mt-2 text-lg">나의 이상형을 찾아서</p>
        </div>

        {/* 로그인 폼 */}
        <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-gray-700 mb-1 text-base">
                이메일
              </label>
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
              <label className="block text-gray-700 mb-1 text-base">
                비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                placeholder="비밀번호를 입력하세요"
                required
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}

            <button
              type="submit"
              className="w-full py-3 px-4 bg-pink-500 hover:bg-pink-600 text-white font-medium rounded-md transition duration-200 text-lg"
              disabled={loading}
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <div className="text-center">
            <Link 
              href="/signup" 
              className="text-gray-700 hover:text-gray-900 text-base"
            >
              회원가입
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
