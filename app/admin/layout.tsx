'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAdminAuth();

  useEffect(() => {
    let mounted = true;

    async function checkAccess() {
      try {
        if (!mounted) return;

        console.log('어드민 권한 확인 시작');

        // 토큰 확인 (디버깅)
        const token = localStorage.getItem('admin_access_token');
        console.log('어드민 레이아웃에서 토큰 확인:', !!token);

        // 인증되지 않은 경우
        if (!isAuthenticated || !user) {
          console.warn('어드민 인증된 세션이 없음 - 관리자 페이지 접근 거부');
          router.replace('/');
          return;
        }

        console.log('어드민 로그인 사용자:', user.email);
        console.log('어드민 권한 확인됨');

      } catch (error) {
        console.error('어드민 확인 중 오류:', error);
        if (mounted) {
          router.replace('/');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    checkAccess();

    return () => {
      mounted = false;
    };
  }, [router, user, isAuthenticated]);

  const handleLogout = async () => {
    try {
      console.log('어드민 로그아웃 시도');
      await logout();
      console.log('어드민 로그아웃 성공 - 로그인 페이지로 리디렉션');
    } catch (error) {
      console.error('어드민 로그아웃 처리 중 예외 발생:', error);
      router.push('/');
    }
  };

  // 로딩 중일 때의 UI
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-DEFAULT border-t-transparent border-solid rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">관리자 권한 확인 중...</p>
        </div>
      </div>
    );
  }

  // 관리자가 아닐 때의 UI
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center bg-white p-8 rounded-lg shadow-md">
          <p className="text-red-600 font-bold text-xl mb-4">관리자 권한이 필요합니다</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-primary-DEFAULT text-white rounded-md hover:bg-primary-dark transition-colors"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 관리자 UI
  return (
    <div className="flex h-screen bg-gray-100">
      {/* 사이드바 */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold text-primary-DEFAULT">관리자 대시보드</h2>
          <p className="text-sm text-gray-500 mt-1">{user?.email}</p>
        </div>
        <nav className="mt-4">
          <ul>
            <li>
              <Link href="/admin/dashboard" className="block px-4 py-2 text-gray-600 hover:bg-primary-DEFAULT hover:text-white transition-colors">
                대시보드
              </Link>
            </li>
            <li>
              <Link href="/admin/community" className="block px-4 py-2 text-gray-600 hover:bg-primary-DEFAULT hover:text-white transition-colors">
                커뮤니티 관리
              </Link>
            </li>
            <li>
              <Link href="/admin/users/appearance" className="block px-4 py-2 text-gray-600 hover:bg-primary-DEFAULT hover:text-white transition-colors">
                사용자 관리
              </Link>
            </li>
            <li>
              <Link href="/admin/matching" className="block px-4 py-2 text-gray-600 hover:bg-primary-DEFAULT hover:text-white transition-colors">
                매칭 설정
              </Link>
            </li>
            <li>
              <Link href="/admin/matching-analytics" className="block px-4 py-2 text-gray-600 hover:bg-primary-DEFAULT hover:text-white transition-colors">
                매칭 분석
              </Link>
            </li>

            <li>
              <Link href="/admin/analytics" className="block px-4 py-2 text-gray-600 hover:bg-primary-DEFAULT hover:text-white transition-colors">
                트래픽 분석
              </Link>
            </li>
            <li>
              <Link href="/admin/rematch" className="block px-4 py-2 text-gray-600 hover:bg-primary-DEFAULT hover:text-white transition-colors">
                재매칭 요청 관리
              </Link>
            </li>
            <li>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-red-500 hover:bg-red-50 transition-colors"
              >
                로그아웃
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 overflow-auto">
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
