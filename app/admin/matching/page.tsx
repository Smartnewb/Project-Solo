'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminMatching() {
  const [matchingDateTime, setMatchingDateTime] = useState('');
  const [isSignupEnabled, setIsSignupEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '' });
  const router = useRouter();

  useEffect(() => {
    // 현재 설정된 매칭 시간과 회원가입 상태 불러오기
    fetchMatchingTime();
    fetchSignupStatus();
  }, []);

  const fetchMatchingTime = async () => {
    try {
      const response = await fetch('/api/admin/matching-time');
      const data = await response.json();
      
      if (data.matchingDateTime) {
        setMatchingDateTime(data.matchingDateTime);
      }
    } catch (error) {
      setMessage({ type: 'error', content: '매칭 시간 조회에 실패했습니다.' });
    }
  };

  const fetchSignupStatus = async () => {
    try {
      const response = await fetch('/api/admin/signup-control');
      const data = await response.json();
      setIsSignupEnabled(data.isSignupEnabled);
    } catch (error) {
      console.error('회원가입 상태 조회 실패:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', content: '' });

    try {
      const response = await fetch('/api/admin/matching-time', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ matchingDateTime }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', content: '매칭 시간이 성공적으로 설정되었습니다.' });
      } else {
        setMessage({ type: 'error', content: data.error || '매칭 시간 설정에 실패했습니다.' });
      }
    } catch (error) {
      setMessage({ type: 'error', content: '매칭 시간 설정에 실패했습니다.' });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSignup = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/signup-control', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isSignupEnabled: !isSignupEnabled }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSignupEnabled(!isSignupEnabled);
        setMessage({
          type: 'success',
          content: `회원가입이 ${!isSignupEnabled ? '활성화' : '비활성화'}되었습니다.`
        });
      } else {
        setMessage({
          type: 'error',
          content: data.error || '회원가입 상태 변경에 실패했습니다.'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        content: '회원가입 상태 변경에 실패했습니다.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-6">매칭 시간 설정</h1>
        
        <form onSubmit={handleSubmit} className="max-w-md">
          <div className="mb-4">
            <label htmlFor="matchingDateTime" className="block text-sm font-medium text-gray-700 mb-2">
              매칭 시작 시간
            </label>
            <input
              type="datetime-local"
              id="matchingDateTime"
              value={matchingDateTime}
              onChange={(e) => setMatchingDateTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-primary-DEFAULT text-white py-2 px-4 rounded-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? '저장 중...' : '저장하기'}
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">회원가입 제어</h2>
        <div className="max-w-md space-y-4">
          <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
            <div>
              <p className="font-medium">회원가입 상태</p>
              <p className={`text-sm ${isSignupEnabled ? 'text-green-600' : 'text-red-600'}`}>
                {isSignupEnabled ? '활성화' : '비활성화'}
              </p>
            </div>
            <button
              onClick={toggleSignup}
              disabled={isLoading}
              className={`px-4 py-2 rounded-md ${
                isSignupEnabled
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isSignupEnabled ? '비활성화하기' : '활성화하기'}
            </button>
          </div>
          
          {message.content && (
            <div className={`p-3 rounded ${
              message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {message.content}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 