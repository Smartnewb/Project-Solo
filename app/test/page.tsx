'use client';

import { useState, useEffect } from 'react';

interface TestResult {
  status: string;
  message: string;
  auth: string;
  storage: string;
  error?: string;
  debug?: {
    databaseError?: string;
    authError?: string;
    storageError?: string;
    url?: string;
    anonKey?: string;
  };
}

export default function TestPage() {
  const [connectionStatus, setConnectionStatus] = useState<any>(null);
  const [schemaStatus, setSchemaStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      setLoading(true);
      setError(null);

      // 기본 연결 테스트
      const connRes = await fetch('/api/test-connection');
      const connData = await connRes.json();

      // 스키마 테스트
      const schemaRes = await fetch('/api/test-schema');
      const schemaData = await schemaRes.json();

      setConnectionStatus(connData);
      setSchemaStatus(schemaData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-4">Supabase 연결 테스트</h1>
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Supabase 연결 테스트</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* 기본 연결 상태 */}
          <div>
            <h2 className="text-xl font-semibold mb-2">기본 연결 상태</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 rounded ${connectionStatus?.connectionStatus === 'Connected' ? 'bg-green-100' : 'bg-red-100'}`}>
                <p className="font-medium">연결 상태</p>
                <p>{connectionStatus?.connectionStatus || '알 수 없음'}</p>
              </div>
              <div className={`p-4 rounded ${connectionStatus?.authService === 'Working' ? 'bg-green-100' : 'bg-red-100'}`}>
                <p className="font-medium">인증 서비스</p>
                <p>{connectionStatus?.authService || '알 수 없음'}</p>
              </div>
            </div>
          </div>

          {/* 스키마 상태 */}
          {schemaStatus && (
            <div>
              <h2 className="text-xl font-semibold mb-2">스키마 상태</h2>
              <div className="space-y-4">
                {schemaStatus.tables?.map((table: any) => (
                  <div key={table.table} className={`p-4 rounded ${table.exists ? 'bg-green-100' : 'bg-red-100'}`}>
                    <p className="font-medium">{table.table}</p>
                    <p>{table.exists ? '테이블 존재함' : '테이블 없음'}</p>
                    {table.error && <p className="text-red-600 text-sm">{table.error}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4">
            <button
              onClick={checkConnection}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              다시 테스트
            </button>
          </div>

          <div className="text-sm text-gray-500">
            마지막 업데이트: {new Date(schemaStatus?.timestamp || connectionStatus?.timestamp).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
} 