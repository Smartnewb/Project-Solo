'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { createClientSupabaseClient } from '@/utils/supabase';

const supabase = createClientSupabaseClient();

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    async function checkAccess() {
      try {
        setLoading(true);
        console.log('관리자 권한 확인 시작');
        
        // AuthContext에서 제공하는 isAdmin 값 확인
        if (!user) {
          console.warn('인증된 세션이 없음 - 관리자 페이지 접근 거부');
          router.push('/');
          return;
        }
        
        console.log('로그인 사용자:', user.email);
        console.log('관리자 여부:', isAdmin);
        
        // 관리자가 아니면 홈으로 리디렉션
        if (!isAdmin) {
          console.warn('관리자가 아닌 사용자의 접근 시도:', user.email);
          router.push('/');
          return;
        }
        
        console.log('관리자 권한 확인됨');
      } catch (error) {
        console.error('관리자 확인 중 오류:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    }
    
    checkAccess();
  }, [router, user, isAdmin]);
  
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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 font-bold text-xl">관리자 권한이 필요합니다</p>
          <button 
            onClick={() => router.push('/')}
            className="mt-4 px-4 py-2 bg-primary-DEFAULT text-white rounded-md hover:bg-primary-dark"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

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
