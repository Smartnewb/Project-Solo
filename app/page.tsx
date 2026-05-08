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
    <div className="flex min-h-screen flex-col items-center justify-center bg-white p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-[28px] font-bold leading-[1.43] text-[#222222]">Sometime</h1>
          <p className="mt-2 text-base text-[#6a6a6a]">관리자 대시보드</p>
        </div>

        <div className="space-y-6 rounded-[14px] border border-[#dddddd] bg-white p-8 shadow-card">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="mb-1 block text-base text-[#3f3f3f]">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="min-h-14 w-full rounded-lg border border-[#dddddd] px-4 py-3 text-[#222222] placeholder:text-[#6a6a6a] focus:border-[#222222] focus:outline-none"
                placeholder="관리자 이메일을 입력하세요"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-base text-[#3f3f3f]">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="min-h-14 w-full rounded-lg border border-[#dddddd] px-4 py-3 text-[#222222] placeholder:text-[#6a6a6a] focus:border-[#222222] focus:outline-none"
                placeholder="비밀번호를 입력하세요"
                required
              />
            </div>

            {error && <div className="text-sm text-[#c13515]">{error}</div>}

            <button
              type="submit"
              className="min-h-12 w-full rounded-lg bg-[#ff385c] px-6 py-[14px] text-base font-medium text-white transition-colors hover:bg-[#e00b41] disabled:bg-[#ffd1da]"
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
