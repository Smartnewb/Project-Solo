'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
// 아이콘 컴포넌트 직접 정의
const Bars3Icon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
);

const XMarkIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const HomeIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
  </svg>
);

const ChatBubbleLeftRightIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
  </svg>
);

const UserGroupIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
  </svg>
);

const ArrowPathIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

const ChartBarIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
);

const SignalIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.348 14.651a3.75 3.75 0 010-5.303m5.304 0a3.75 3.75 0 010 5.303m-7.425 2.122a6.75 6.75 0 010-9.546m9.546 0a6.75 6.75 0 010 9.546M5.106 18.894c-3.808-3.808-3.808-9.98 0-13.789m13.788 0c3.808 3.808 3.808 9.981 0 13.79M12 12h.008v.007H12V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
  </svg>
);

const ArrowRightOnRectangleIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
  </svg>
);

const ArrowPathRoundedSquareIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
  </svg>
);

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
    try {
      if (typeof window !== 'undefined') {
        const savedState = localStorage.getItem('adminSidebarOpen');
        if (savedState !== null) {
          setSidebarOpen(savedState === 'true');
        }
      }
    } catch (error) {
      console.error('사이드바 상태 로드 중 오류:', error);
    }
  }, []);

  // 사이드바 토글 함수
  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);

    // 로컬 스토리지에 상태 저장
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('adminSidebarOpen', String(newState));
      }
    } catch (error) {
      console.error('사이드바 상태 저장 중 오류:', error);
    }
  };

  useEffect(() => {
    let mounted = true;
    let checkTimeout = null;

    async function checkAccess() {
      try {
        if (!mounted) return;

        console.log('어드민 권한 확인 시작');

        // 토큰 확인 (여러 저장소에서 확인)
        let token = null;

        // 1. localStorage에서 확인
        try {
          token = localStorage.getItem('admin_access_token');
        } catch (e) {
          console.error('localStorage에서 토큰 가져오기 실패:', e);
        }

        // 2. sessionStorage에서 확인
        if (!token) {
          try {
            token = sessionStorage.getItem('admin_access_token');
          } catch (e) {
            console.error('sessionStorage에서 토큰 가져오기 실패:', e);
          }
        }

        // 3. 쿠키에서 확인
        if (!token && typeof document !== 'undefined') {
          try {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
              const cookie = cookies[i].trim();
              if (cookie.startsWith('admin_access_token=')) {
                token = cookie.substring('admin_access_token='.length);
                break;
              }
            }
          } catch (e) {
            console.error('쿠키에서 토큰 가져오기 실패:', e);
          }
        }

        console.log('어드민 레이아웃에서 토큰 확인:', !!token);

        // 인증 상태 확인 (isAuthenticated가 아직 설정되지 않았을 수 있음)
        if (!isAuthenticated || !user) {
          // 토큰이 있지만 인증 상태가 설정되지 않은 경우, 약간 지연 후 다시 확인
          if (token) {
            console.log('토큰은 있지만 인증 상태가 설정되지 않음. 잠시 후 다시 확인...');

            if (mounted) {
              // 로딩 상태 유지
              setLoading(true);

              // 0.5초 후 다시 확인
              checkTimeout = setTimeout(() => {
                if (mounted) {
                  // 여전히 인증되지 않았다면 로그인 페이지로 이동
                  if (!isAuthenticated || !user) {
                    console.warn('어드민 인증된 세션이 없음 - 관리자 페이지 접근 거부');
                    router.replace('/');
                  } else {
                    console.log('지연 후 인증 상태 확인됨');
                    setLoading(false);
                  }
                }
              }, 500);

              return;
            }
          } else {
            // 토큰이 없는 경우 로그인 페이지로 이동
            console.warn('어드민 인증된 세션이 없음 - 관리자 페이지 접근 거부');
            router.replace('/');
            return;
          }
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
      if (checkTimeout) {
        clearTimeout(checkTimeout);
      }
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
    // 로그인 페이지로 리다이렉트하지만, 사이드바 토글 기능은 테스트할 수 있도록 함
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
              <p className="text-sm text-gray-500 mt-1">로그인이 필요합니다</p>
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
                  href="/"
                  className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors rounded-md mx-2"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3" />
                  로그인 페이지로 이동
                </Link>
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
            <h1 className="ml-4 text-lg font-semibold">관리자 로그인 필요</h1>
          </div>

          <main className="p-4 md:p-6 flex items-center justify-center min-h-[calc(100vh-64px)]">
            <div className="text-center bg-white p-8 rounded-lg shadow-md">
              <p className="text-red-600 font-bold text-xl mb-4">관리자 권한이 필요합니다</p>
              <button
                onClick={() => router.push('/')}
                className="px-6 py-2 bg-primary-DEFAULT text-white rounded-md hover:bg-primary-dark transition-colors"
              >
                로그인 페이지로 이동
              </button>
            </div>
          </main>
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
                  pathname && pathname === '/admin/dashboard'
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
                  pathname && (pathname === '/admin/community' || pathname.startsWith('/admin/community/'))
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
                  pathname && (pathname === '/admin/users/appearance' || pathname.startsWith('/admin/users/'))
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
                  pathname && pathname === '/admin/matching'
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
                  pathname && pathname === '/admin/matching-analytics'
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
                  pathname && pathname === '/admin/analytics'
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
                  pathname && pathname === '/admin/rematch'
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
