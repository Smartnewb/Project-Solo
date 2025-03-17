'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminIndex() {
  const router = useRouter();
  
  useEffect(() => {
    // 기본적으로 커뮤니티 관리 페이지로 리다이렉션
    router.push('/admin/community');
  }, [router]);
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-DEFAULT mx-auto"></div>
        <p className="mt-4 text-gray-600">페이지 이동 중...</p>
      </div>
    </div>
  );
} 