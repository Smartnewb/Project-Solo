'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

const ADMIN_EMAIL = 'notify@smartnewb.com';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function checkAdmin() {
      try {
        console.log('관리자 권한 확인 시작');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('세션 조회 오류:', sessionError);
          return false;
        }
        
        if (!session || !session.user) {
          console.warn('인증된 세션이 없음 - 관리자 페이지 접근 거부');
          return false;
        }
        
        console.log('로그인 사용자:', session.user.email);
        
        // 개발 환경에서는 모든 인증된 사용자를 관리자로 허용
        if (process.env.NODE_ENV === 'development') {
          console.log('개발 환경 - 모든 인증된 사용자를 관리자로 허용');
          return true;
        }
        
        // 관리자 확인 (이메일 기반)
        if (session.user.email === ADMIN_EMAIL) {
          console.log('관리자 권한 확인됨');
          return true;
        }
        
        console.warn('관리자가 아닌 사용자의 접근 시도:', session.user.email);
        return false;
      } catch (error) {
        console.error('관리자 권한 확인 중 오류 발생:', error);
        return false;
      }
    }
    
    async function init() {
      try {
        setLoading(true);
        const isAdminUser = await checkAdmin();
        setIsAdmin(isAdminUser);
        
        if (!isAdminUser) {
          console.log('관리자 아님 - 홈페이지로 리디렉션');
          router.push('/');
        }
      } catch (error) {
        console.error('관리자 확인 중 오류:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    }
    
    init();
  }, [router, supabase]);
  
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-DEFAULT border-t-transparent border-solid rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">관리자 권한 확인 중...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // 리디렉션 중에는 아무것도 표시하지 않음
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* 사이드바 */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold text-primary-DEFAULT">관리자 대시보드</h2>
        </div>
        <nav className="mt-4">
          <ul>
            <li>
              <Link href="/admin/community" className="block px-4 py-2 text-gray-600 hover:bg-primary-DEFAULT hover:text-white">
                커뮤니티 관리
              </Link>
            </li>
            <li>
              <Link href="/admin/users" className="block px-4 py-2 text-gray-600 hover:bg-primary-DEFAULT hover:text-white">
                사용자 관리
              </Link>
            </li>
            <li>
              <Link href="/admin/matching" className="block px-4 py-2 text-gray-600 hover:bg-primary-DEFAULT hover:text-white">
                매칭 설정
              </Link>
            </li>
            <li>
              <button 
                onClick={handleLogout} 
                className="w-full text-left px-4 py-2 text-red-500 hover:bg-red-50"
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
