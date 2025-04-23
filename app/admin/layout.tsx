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

    let supabaseBrowser;
    try {
      supabaseBrowser = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
    } catch (error) {
      console.error('Supabase 클라이언트 생성 오류:', error);
      return;
    }

    const verifyAdminStatus = async () => {
      try {
        console.log('관리자 상태 검증 시작');

        // 저장된 관리자 상태 확인
        const savedStatus = localStorage.getItem('admin_status');
        const isAdminFlag = localStorage.getItem('isAdmin') === 'true';
        const accessToken = localStorage.getItem('accessToken');

        // Supabase 세션 확인
        const { data: { session } } = await supabaseBrowser.auth.getSession();

        console.log('관리자 검증 상태:', {
          hasSession: !!session,
          hasAdminStatus: !!savedStatus,
          isAdmin: isAdminFlag,
          hasToken: !!accessToken,
          sessionEmail: session?.user?.email
        });

        // 세션이 없으면 관리자 상태 초기화
        if (!session) {
          // 세션이 없지만 저장된 관리자 상태가 있고 토큰이 있는 경우
          if (savedStatus && accessToken && isAdminFlag) {
            try {
              const { verified, timestamp } = JSON.parse(savedStatus);
              // 8시간 이내의 검증 기록이 있으면 유지
              if (verified && Date.now() - timestamp < 8 * 60 * 60 * 1000) {
                console.log('세션은 없지만 유효한 관리자 상태 유지');
                setAdminState({
                  isVerified: true,
                  lastVerified: timestamp
                });
                return;
              }
            } catch (e) {
              console.error('저장된 관리자 상태 파싱 오류:', e);
            }
          }

          console.log('세션이 없어 관리자 상태 초기화');
          localStorage.removeItem('admin_status');
          setAdminState({
            isVerified: false,
            lastVerified: 0
          });
          return;
        }

        // 현재 세션의 이메일과 저장된 이메일이 다르면 초기화
        if (savedStatus) {
          try {
            const { email } = JSON.parse(savedStatus);
            if (email && email !== session.user.email) {
              console.log('이메일 불일치: 저장된 이메일과 현재 세션 이메일이 다름');
              localStorage.removeItem('admin_status');
              setAdminState({
                isVerified: false,
                lastVerified: 0
              });
            }
          } catch (e) {
            console.error('이메일 비교 중 오류:', e);
          }
        }

        // 관리자 이메일 확인
        const isAdminEmail = session?.user.email === ADMIN_EMAIL ||
                            session?.user.email === process.env.NEXT_PUBLIC_DEFAULT_ADMIN_EMAIL;

        if (isAdminEmail) {
          console.log('관리자 이메일 확인됨:', session.user.email);

          // 관리자 상태 저장
          setAdminState({
            isVerified: true,
            lastVerified: Date.now()
          });

          // 로컬스토리지에도 저장
          localStorage.setItem('isAdmin', 'true');
          localStorage.setItem('admin_status', JSON.stringify({
            verified: true,
            timestamp: Date.now(),
            email: session?.user?.email
          }));

          // 토큰이 없는 경우 임시 토큰 생성
          if (!accessToken) {
            const tempToken = 'temp_admin_' + Date.now();
            localStorage.setItem('accessToken', tempToken);
            document.cookie = `accessToken=${tempToken}; path=/; max-age=28800; SameSite=Lax`;
            console.log('관리자용 임시 토큰 생성');
          }
        } else {
          console.log('관리자 이메일이 아님:', session.user.email);
          localStorage.removeItem('admin_status');
          localStorage.removeItem('isAdmin');
          setAdminState({
            isVerified: false,
            lastVerified: 0
          });
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
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    const accessToken = localStorage.getItem('accessToken');

    console.log('관리자 상태 초기화:', { savedStatus, isAdmin, hasToken: !!accessToken });

    if (savedStatus) {
      try {
        const { verified, timestamp, email } = JSON.parse(savedStatus);
        // 8시간 이내의 검증 기록이 있으면 사용
        if (Date.now() - timestamp < 8 * 60 * 60 * 1000) {
          console.log('유효한 관리자 상태 발견:', { verified, timestamp, email });
          setAdminState({
            isVerified: verified,
            lastVerified: timestamp
          });

          // 토큰이 없지만 관리자 상태가 유효한 경우, 임시 토큰 생성
          if (!accessToken && verified && isAdmin) {
            console.log('관리자 상태는 유효하지만 토큰이 없음, 임시 토큰 생성');
            const tempToken = 'temp_' + Date.now();
            localStorage.setItem('accessToken', tempToken);
            document.cookie = `accessToken=${tempToken}; path=/; max-age=28800; SameSite=Lax`;
          }
        } else {
          console.log('관리자 상태가 만료됨:', { timestamp, now: Date.now() });
        }
      } catch (error) {
        console.error('관리자 상태 파싱 오류:', error);
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
