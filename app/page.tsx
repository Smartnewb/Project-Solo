'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function Login() {
  const { login, user, loading } = useAuth();
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
      await login(email.trim(), password);
    } catch (err: any) {
      console.error('로그인 중 오류:', err);
      setError(err.message);
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
          <h1 className="text-5xl font-bold text-gray-800">Sometime</h1>
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
              disabled={isLoading}
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <div className="text-center">
            <Link href="/signup" className="text-gray-700 hover:text-gray-900 text-base">
              회원가입
            </Link>
          </div>
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
