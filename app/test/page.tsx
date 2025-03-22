import dynamic from 'next/dynamic';

// 클라이언트 컴포넌트를 동적으로 로드
const TestCommunityPost = dynamic(() => import('./test-component'), {
  ssr: false,
});

export default function TestPage() {
  return (
    <main className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-8 text-center">테스트 페이지</h1>
      <TestCommunityPost />
    </main>
  );
} 