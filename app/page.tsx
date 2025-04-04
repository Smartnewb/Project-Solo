'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ADMIN_EMAIL } from '@/utils/config';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setError(null);
    setLoading(true);

    // 입력값 검증
    if (!email || !password) {
      setError('이메일과 비밀번호를 모두 입력해주세요.');
      setLoading(false);
      return;
    }

    try {
      const loginData = {
        email: email.trim(),
        password: password
      };

      console.log('로그인 시도 중...', { email: loginData.email });

      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      const data = await res.json();
      console.log('로그인 응답 데이터:', data); // 응답 데이터 확인

      if (!res.ok) {
        // HTTP 상태 코드에 따른 에러 메시지 처리
        let errorMessage;
        switch (res.status) {
          case 401:
            errorMessage = '이메일 또는 비밀번호가 올바르지 않습니다.';
            break;
          case 404:
            errorMessage = '등록되지 않은 이메일입니다.';
            break;
          default:
            errorMessage = data.message || '로그인에 실패했습니다.';
        }
        throw new Error(errorMessage);
      }
      
      // 응답 데이터 구조 확인
      if (!data.accessToken) {
        throw new Error('토큰이 없습니다.');
      }

      // 액세스 토큰 저장
      localStorage.setItem('accessToken', data.accessToken);
      
      // 사용자 정보가 data.user 또는 data에 있는지 확인
      const userInfo = data.user || data;
      
      // 사용자 정보 저장
      localStorage.setItem('user', JSON.stringify(userInfo));
      
      // 관리자 여부 확인 및 저장
      const isAdmin = userInfo.email === ADMIN_EMAIL;
      localStorage.setItem('isAdmin', String(isAdmin));

      console.log('로그인 성공, 저장된 정보:', {
        accessToken: data.accessToken,
        userInfo,
        isAdmin
      });

      // 적절한 페이지로 리다이렉트
      const targetPath = isAdmin ? '/admin/community' : '/home';
      console.log('리다이렉트 시도:', targetPath);
      
      router.replace(targetPath);

    } catch (err) {
      console.error('로그인 중 오류:', err);
      setError(err instanceof Error ? err.message : '로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-800">Project-Solo</h1>
          <p className="text-gray-600 mt-2 text-lg">나의 이상형을 찾아서</p>
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
              disabled={loading}
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <div className="text-center">
            <Link href="/signup" className="text-gray-700 hover:text-gray-900 text-base">
              회원가입
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
