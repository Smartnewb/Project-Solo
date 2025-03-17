'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAdminAccess() {
      try {
        setLoading(true);
        
        // 세션 가져오기
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) {
          console.error('Admin access failed: No session');
          router.push('/');
          return;
        }

        // 어드민 권한 체크
        if (session.user.email !== 'notify@smartnewb.com') {
          console.error('Admin access failed: Not an admin');
          router.push('/home');
          return;
        }

        console.log('Admin access granted');
        setUser(session.user);
        setLoading(false);
      } catch (error) {
        console.error('Error checking admin access:', error);
        router.push('/');
      }
    }

    checkAdminAccess();
  }, [router, supabase]);

  // 로그아웃 처리
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-DEFAULT mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* 사이드바 */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-6">
          <h1 className="text-xl font-bold text-primary-DEFAULT">관리자 페이지</h1>
          <p className="text-sm text-gray-500 mt-1">{user?.email}</p>
        </div>
        <nav className="mt-6">
          <ul>
            <li>
              <Link href="/admin/community" className="block py-2 px-4 hover:bg-gray-100">
                커뮤니티 관리
              </Link>
            </li>
            <li>
              <Link href="/admin/users" className="block py-2 px-4 hover:bg-gray-100">
                사용자 관리
              </Link>
            </li>
            <li>
              <button 
                onClick={handleLogout}
                className="w-full text-left py-2 px-4 text-red-500 hover:bg-gray-100"
              >
                로그아웃
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm p-4">
          <h2 className="text-lg font-semibold">관리자 대시보드</h2>
        </header>
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
