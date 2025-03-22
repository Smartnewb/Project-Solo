import Link from 'next/link';

export default function TestPage() {
  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center">커뮤니티 기능 테스트</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg shadow-sm p-6 bg-white">
          <h2 className="text-xl font-bold mb-4">게시글 테스트</h2>
          <p className="text-gray-600 mb-4">
            게시글 CRUD 관련 기능들을 테스트합니다.
          </p>
          <div className="flex flex-col space-y-2">
            <Link 
              href="/community/test-list"
              className="px-4 py-2 bg-blue-500 text-white text-center rounded hover:bg-blue-600"
            >
              게시글 목록 테스트
            </Link>
            <Link 
              href="/community/test-write"
              className="px-4 py-2 bg-green-500 text-white text-center rounded hover:bg-green-600"
            >
              게시글 작성 테스트
            </Link>
          </div>
        </div>
        
        <div className="border rounded-lg shadow-sm p-6 bg-white">
          <h2 className="text-xl font-bold mb-4">댓글 테스트</h2>
          <p className="text-gray-600 mb-4">
            댓글 작성 및 표시와 관련된 기능들을 테스트합니다.
          </p>
          <div className="flex flex-col space-y-2">
            <Link 
              href="/community/test-comment"
              className="px-4 py-2 bg-purple-500 text-white text-center rounded hover:bg-purple-600"
            >
              댓글 작성 테스트
            </Link>
          </div>
        </div>
        
        <div className="border rounded-lg shadow-sm p-6 bg-white">
          <h2 className="text-xl font-bold mb-4">API 테스트</h2>
          <p className="text-gray-600 mb-4">
            백엔드 API 기능을 직접 테스트합니다.
          </p>
          <div className="flex flex-col space-y-2">
            <Link 
              href="/api/community/test"
              className="px-4 py-2 bg-yellow-500 text-white text-center rounded hover:bg-yellow-600"
              target="_blank"
            >
              API 스키마 테스트
            </Link>
          </div>
        </div>
        
        <div className="border rounded-lg shadow-sm p-6 bg-white">
          <h2 className="text-xl font-bold mb-4">기타 테스트</h2>
          <p className="text-gray-600 mb-4">
            기타 커뮤니티 관련 기능을 테스트합니다.
          </p>
          <div className="flex flex-col space-y-2">
            <Link 
              href="/community"
              className="px-4 py-2 bg-gray-500 text-white text-center rounded hover:bg-gray-600"
            >
              실제 커뮤니티 페이지로 이동
            </Link>
          </div>
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-bold text-lg mb-2">유의사항</h3>
        <ul className="list-disc list-inside text-gray-700 space-y-1">
          <li>테스트 전에 로그인이 필요합니다.</li>
          <li>데이터베이스에 실제 데이터가 저장됩니다.</li>
          <li>문제가 발생하면 로그를 확인하세요.</li>
        </ul>
      </div>
    </div>
  );
} 