'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  ArrowPathIcon,
  ChartBarIcon,
  SignalIcon,
  ArrowRightOnRectangleIcon,
  ArrowPathRoundedSquareIcon
} from '@heroicons/react/24/outline';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAdminAuth();

  // 로컬 스토리지에서 사이드바 상태 불러오기
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('adminSidebarOpen');
      if (savedState !== null) {
        setSidebarOpen(savedState === 'true');
      }
    }
  }, []);

  // 사이드바 토글 함수
  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);

    // 로컬 스토리지에 상태 저장
    if (typeof window !== 'undefined') {
      localStorage.setItem('adminSidebarOpen', String(newState));
    }
  };

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
      {/* 사이드바 오버레이 (모바일에서만 표시) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-10 md:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      {/* 사이드바 */}
      <div className={`
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${sidebarOpen ? 'md:w-64' : 'md:w-0'}
        fixed md:relative z-20 h-full bg-white shadow-md transition-all duration-300 overflow-hidden
      `}>
        <div className="p-4 border-b flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-primary-DEFAULT">관리자 대시보드</h2>
            <p className="text-sm text-gray-500 mt-1">{user?.email}</p>
          </div>
          {/* 모바일에서만 보이는 닫기 버튼 */}
          <button
            className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
            onClick={toggleSidebar}
            aria-label="사이드바 닫기"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <nav className="mt-4">
          <ul className="space-y-1">
            <li>
              <Link
                href="/admin/dashboard"
                className={`flex items-center px-4 py-3 text-sm ${
                  pathname === '/admin/dashboard'
                    ? 'bg-primary-DEFAULT text-white font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                } transition-colors rounded-md mx-2`}
              >
                <HomeIcon className="h-5 w-5 mr-3" />
                대시보드
              </Link>
            </li>
            <li>
              <Link
                href="/admin/community"
                className={`flex items-center px-4 py-3 text-sm ${
                  pathname === '/admin/community' || pathname.startsWith('/admin/community/')
                    ? 'bg-primary-DEFAULT text-white font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                } transition-colors rounded-md mx-2`}
              >
                <ChatBubbleLeftRightIcon className="h-5 w-5 mr-3" />
                커뮤니티 관리
              </Link>
            </li>
            <li>
              <Link
                href="/admin/users/appearance"
                className={`flex items-center px-4 py-3 text-sm ${
                  pathname === '/admin/users/appearance' || pathname.startsWith('/admin/users/')
                    ? 'bg-primary-DEFAULT text-white font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                } transition-colors rounded-md mx-2`}
              >
                <UserGroupIcon className="h-5 w-5 mr-3" />
                사용자 관리
              </Link>
            </li>
            <li>
              <Link
                href="/admin/matching"
                className={`flex items-center px-4 py-3 text-sm ${
                  pathname === '/admin/matching'
                    ? 'bg-primary-DEFAULT text-white font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                } transition-colors rounded-md mx-2`}
              >
                <ArrowPathIcon className="h-5 w-5 mr-3" />
                매칭 설정
              </Link>
            </li>
            <li>
              <Link
                href="/admin/matching-analytics"
                className={`flex items-center px-4 py-3 text-sm ${
                  pathname === '/admin/matching-analytics'
                    ? 'bg-primary-DEFAULT text-white font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                } transition-colors rounded-md mx-2`}
              >
                <ChartBarIcon className="h-5 w-5 mr-3" />
                매칭 분석
              </Link>
            </li>
            <li>
              <Link
                href="/admin/analytics"
                className={`flex items-center px-4 py-3 text-sm ${
                  pathname === '/admin/analytics'
                    ? 'bg-primary-DEFAULT text-white font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                } transition-colors rounded-md mx-2`}
              >
                <SignalIcon className="h-5 w-5 mr-3" />
                트래픽 분석
              </Link>
            </li>
            <li>
              <Link
                href="/admin/rematch"
                className={`flex items-center px-4 py-3 text-sm ${
                  pathname === '/admin/rematch'
                    ? 'bg-primary-DEFAULT text-white font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                } transition-colors rounded-md mx-2`}
              >
                <ArrowPathRoundedSquareIcon className="h-5 w-5 mr-3" />
                재매칭 요청 관리
              </Link>
            </li>
            <li className="mt-4 px-2">
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors rounded-md"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3" />
                로그아웃
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 overflow-auto w-full md:w-auto">
        {/* 상단 헤더 바 */}
        <div className="bg-white p-4 shadow-sm flex items-center">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none"
            aria-label={sidebarOpen ? "사이드바 닫기" : "사이드바 열기"}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <h1 className="ml-4 text-lg font-semibold">관리자 대시보드</h1>
        </div>

        <main className="p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
