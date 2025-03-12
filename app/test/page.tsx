'use client';

import { useState, useEffect } from 'react';

interface TestResult {
  status: string;
  message: string;
  auth: string;
  storage: string;
  error?: string;
}

export default function TestPage() {
  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const testConnection = async () => {
      try {
        const response = await fetch('/api/test-connection');
        const data = await response.json();
        setResult(data);
      } catch (error) {
        setResult({
          status: 'error',
          message: 'Failed to fetch test results',
          auth: 'Failed',
          storage: 'Failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      } finally {
        setLoading(false);
      }
    };

    testConnection();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Supabase 연결 테스트 중...</h1>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Supabase 연결 테스트 결과</h1>
        
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">상태: {result?.status}</h2>
          
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-gray-50">
              <h3 className="font-medium mb-2">데이터베이스 연결</h3>
              <p className={result?.status === 'success' ? 'text-green-600' : 'text-red-600'}>
                {result?.message}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-gray-50">
              <h3 className="font-medium mb-2">인증 서비스</h3>
              <p className={result?.auth.includes('working') ? 'text-green-600' : 'text-red-600'}>
                {result?.auth}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-gray-50">
              <h3 className="font-medium mb-2">스토리지 서비스</h3>
              <p className={result?.storage.includes('working') ? 'text-green-600' : 'text-red-600'}>
                {result?.storage}
              </p>
            </div>

            {result?.error && (
              <div className="p-4 rounded-lg bg-red-50">
                <h3 className="font-medium mb-2">에러</h3>
                <p className="text-red-600">{result.error}</p>
              </div>
            )}
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            다시 테스트하기
          </button>
        </div>
      </div>
    </div>
  );
} 