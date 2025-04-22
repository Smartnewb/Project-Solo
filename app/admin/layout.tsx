'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { createClientSupabaseClient } from '@/utils/supabase';
import { createBrowserClient } from '@supabase/ssr';
import { ADMIN_EMAIL } from '@/utils/config';

const supabase = createClientSupabaseClient();

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const [adminState, setAdminState] = useState({
    isVerified: false,
    lastVerified: 0
  });

  useEffect(() => {
    const supabaseBrowser = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const verifyAdminStatus = async () => {
      try {
        const { data: { session } } = await supabaseBrowser.auth.getSession();

        // 세션이 없으면 관리자 상태 초기화
        if (!session) {
          localStorage.removeItem('admin_status');
          setAdminState({
            isVerified: false,
            lastVerified: 0
          });
          return;
        }

        // 현재 세션의 이메일과 저장된 이메일이 다르면 초기화
        const savedStatus = localStorage.getItem('admin_status');
        if (savedStatus) {
          const { email } = JSON.parse(savedStatus);
          if (email !== session.user.email) {
            localStorage.removeItem('admin_status');
            setAdminState({
              isVerified: false,
              lastVerified: 0
            });
          }
        }

        if (session?.user.email === ADMIN_EMAIL ||
            session?.user.email === process.env.NEXT_PUBLIC_DEFAULT_ADMIN_EMAIL) {
          // 관리자 상태 저장
          setAdminState({
            isVerified: true,
            lastVerified: Date.now()
          });

          // 로컬스토리지에도 저장
          localStorage.setItem('admin_status', JSON.stringify({
            verified: true,
            timestamp: Date.now(),
            email: session?.user?.email
          }));
        }
      } catch (error) {
        console.error('Admin verification failed:', error);
        // 에러 발생 시 관리자 상태 초기화
        localStorage.removeItem('admin_status');
        setAdminState({
          isVerified: false,
          lastVerified: 0
        });
      }
    }

    // 초기 로드시 로컬스토리지 체크
    const savedStatus = localStorage.getItem('admin_status');
    if (savedStatus) {
      const { verified, timestamp, email } = JSON.parse(savedStatus);
      // 8시간 이내의 검증 기록이 있으면 사용
      if (Date.now() - timestamp < 8 * 60 * 60 * 1000) {
        setAdminState({
          isVerified: verified,
          lastVerified: timestamp
        });
      }
    }

    // 초기 검증
    verifyAdminStatus();

    // 8시간마다 재검증
    const interval = setInterval(verifyAdminStatus, 8 * 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function checkAccess() {
      try {
        if (!mounted) return;

        console.log('관리자 권한 확인 시작');

        // 로딩 중이 아닐 때만 상태 체크
        if (!loading) {
          // 인증되지 않은 경우
          if (!user) {
            console.warn('인증된 세션이 없음 - 관리자 페이지 접근 거부');
            router.replace('/');
            return;
          }

          console.log('로그인 사용자:', user.email);
          console.log('관리자 여부:', isAdmin);

          // 관리자가 아닌 경우
          if (!isAdmin) {
            console.warn('관리자가 아닌 사용자의 접근 시도:', user.email);
            router.replace('/');
            return;
          }

          console.log('관리자 권한 확인됨');
        }
      } catch (error) {
        console.error('관리자 확인 중 오류:', error);
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
  }, [router, user, isAdmin, loading]);

  const handleLogout = async () => {
    try {
      console.log('로그아웃 시도');
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('로그아웃 중 오류 발생:', error);
        return;
      }

      console.log('로그아웃 성공 - 로그인 페이지로 리디렉션');
      router.push('/');
    } catch (error) {
      console.error('로그아웃 처리 중 예외 발생:', error);
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
  if (!isAdmin) {
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
              <Link href="/admin/users" className="block px-4 py-2 text-gray-600 hover:bg-primary-DEFAULT hover:text-white transition-colors">
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
              <Link href="/admin/traffic" className="block px-4 py-2 text-gray-600 hover:bg-primary-DEFAULT hover:text-white transition-colors">
                트래픽
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
