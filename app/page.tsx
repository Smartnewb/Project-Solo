'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || '로그인에 실패했습니다.');
      }

      router.push('/admin/dashboard');
    } catch (err: any) {
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('네트워크 연결을 확인해주세요.');
      } else {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-800">Sometime</h1>
          <p className="text-gray-600 mt-2 text-lg">관리자 대시보드</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-gray-700 mb-1 text-base">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                placeholder="관리자 이메일을 입력하세요"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-1 text-base">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                placeholder="비밀번호를 입력하세요"
                required
              />
            </div>

            {error && <div className="text-red-500 text-sm">{error}</div>}

            <button
              type="submit"
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition duration-200 text-lg"
              disabled={isLoading}
            >
              {isLoading ? '로그인 중...' : '관리자 로그인'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
