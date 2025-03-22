'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TestCommunityPage() {
  const router = useRouter();

  useEffect(() => {
    console.log('테스트 커뮤니티 페이지 로드됨, 커뮤니티 페이지로 자동 이동...');
    
    // 짧은 지연 후 커뮤니티 페이지로 이동
    const timeoutId = setTimeout(() => {
      router.push('/community');
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">테스트 모드 활성화 중...</h1>
        <p className="text-lg text-gray-600 mb-4">커뮤니티 페이지로 이동합니다.</p>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div className="bg-blue-600 h-2.5 rounded-full animate-[progress_1s_ease-in-out]"></div>
        </div>
      </div>
    </div>
  );
}
