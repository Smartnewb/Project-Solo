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
    // 클라이언트 사이드에서만 실행
    if (typeof window === 'undefined') return;

    console.log('관리자 레이아웃 초기화');

    // 관리자 상태 확인
    const checkAdminStatus = () => {
      try {
        // 저장된 관리자 상태 확인
        const savedStatus = localStorage.getItem('admin_status');
        const isAdminFlag = localStorage.getItem('isAdmin') === 'true';
        const accessToken = localStorage.getItem('accessToken');
        const tokenTimestamp = localStorage.getItem('tokenTimestamp');

        console.log('관리자 상태 확인:', {
          hasAdminStatus: !!savedStatus,
          isAdmin: isAdminFlag,
          hasToken: !!accessToken,
          tokenAge: tokenTimestamp ? Math.floor((Date.now() - parseInt(tokenTimestamp)) / 1000 / 60) + '분' : '없음'
        });

        // 관리자 상태가 유효한지 확인
        if (savedStatus && isAdminFlag && accessToken) {
          try {
            const { verified, timestamp } = JSON.parse(savedStatus);
            // 8시간 이내의 검증 기록이 있으면 유지
            if (verified && Date.now() - timestamp < 8 * 60 * 60 * 1000) {
              console.log('유효한 관리자 상태 발견');
              setAdminState({
                isVerified: true,
                lastVerified: timestamp
              });
              return true;
            } else {
              console.log('관리자 상태가 만료됨');
            }
          } catch (e) {
            console.error('관리자 상태 파싱 오류:', e);
          }
        }

        // 토큰이 있지만 관리자 상태가 없는 경우, 상태 생성
        if (accessToken && isAdminFlag && !savedStatus) {
          console.log('토큰은 있지만 관리자 상태 정보가 없음, 생성');
          localStorage.setItem('admin_status', JSON.stringify({
            verified: true,
            timestamp: Date.now(),
            email: 'admin@example.com'
          }));

          setAdminState({
            isVerified: true,
            lastVerified: Date.now()
          });
          return true;
        }

        // 관리자 상태가 유효하지 않은 경우
        return false;
      } catch (error) {
        console.error('관리자 상태 확인 오류:', error);
        return false;
      }
    };

    // 초기 관리자 상태 확인
    const isValidAdmin = checkAdminStatus();

    // 유효한 관리자가 아닌 경우 초기화
    if (!isValidAdmin) {
      console.log('유효한 관리자 상태가 없음, 초기화');
      setAdminState({
        isVerified: false,
        lastVerified: 0
      });
    }

    // 1시간마다 관리자 상태 확인
    const interval = setInterval(checkAdminStatus, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function checkAccess() {
      try {
        if (!mounted) return;

        console.log('관리자 권한 확인 시작');

        // 저장된 관리자 상태 확인
        const savedStatus = localStorage.getItem('admin_status');
        const isAdminFlag = localStorage.getItem('isAdmin') === 'true';
        const accessToken = localStorage.getItem('accessToken');

        console.log('관리자 접근 권한 확인:', {
          hasAdminStatus: !!savedStatus,
          isAdmin: isAdminFlag,
          hasToken: !!accessToken,
          contextIsAdmin: isAdmin,
          contextUser: user ? user.email : '없음'
        });

        // 로딩 중이 아닐 때만 상태 체크
        if (!loading) {
          // 인증되지 않은 경우
          if (!user && !isAdminFlag) {
            console.warn('인증된 세션이 없음 - 관리자 페이지 접근 거부');
            router.replace('/');
            return;
          }

          // 관리자가 아닌 경우
          if (!isAdmin && !isAdminFlag) {
            console.warn('관리자가 아닌 사용자의 접근 시도');
            router.replace('/');
            return;
          }

          // 관리자 상태가 유효한지 확인
          if (savedStatus) {
            try {
              const { verified, timestamp } = JSON.parse(savedStatus);
              // 8시간 이내의 검증 기록이 있으면 유지
              if (verified && Date.now() - timestamp < 8 * 60 * 60 * 1000) {
                console.log('관리자 권한 확인됨');
                return;
              } else {
                console.log('관리자 상태가 만료됨');
                router.replace('/');
                return;
              }
            } catch (e) {
              console.error('관리자 상태 파싱 오류:', e);
            }
          }

          // 여기까지 왔다면 관리자 상태가 유효하지 않음
          console.warn('유효한 관리자 상태가 없음');
          router.replace('/');
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

      // 로컬 스토리지 초기화
      localStorage.removeItem('accessToken');
      localStorage.removeItem('isAdmin');
      localStorage.removeItem('admin_status');
      localStorage.removeItem('tokenTimestamp');

      // 쿠키 초기화
      document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

      // Supabase 로그아웃 시도
      try {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error('Supabase 로그아웃 오류:', error);
        }
      } catch (supabaseError) {
        console.error('Supabase 로그아웃 예외:', supabaseError);
      }

      console.log('로그아웃 성공 - 로그인 페이지로 리디렉션');

      // 로그인 페이지로 이동
      window.location.href = '/';
    } catch (error) {
      console.error('로그아웃 처리 중 예외 발생:', error);

      // 오류가 발생해도 로그인 페이지로 이동
      window.location.href = '/';
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
              <Link href="/admin/sales" className="block px-4 py-2 text-gray-600 hover:bg-primary-DEFAULT hover:text-white transition-colors">
                매출 통계
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
