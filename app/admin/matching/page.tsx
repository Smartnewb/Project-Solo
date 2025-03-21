'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminMatching() {
  const [matchingDate, setMatchingDate] = useState('');
  const [isSignupEnabled, setIsSignupEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; content: string }>({
    type: 'info',
    content: ''
  });

  useEffect(() => {
    fetchMatchingTime();
    fetchSignupStatus();
  }, []);

  const fetchMatchingTime = async () => {
    try {
      setIsLoading(true);
      console.log('매칭 시간 조회 시작');
      
      const response = await fetch('/api/admin/matching-time');
      
      if (!response.ok) {
        throw new Error(`API 응답 오류: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('매칭 시간 데이터:', data);
      
      if (data.matchingTime) {
        setMatchingDate(data.matchingTime);
        setMessage({
          type: 'info',
          content: '현재 설정된 매칭 시간을 불러왔습니다.'
        });
      } else {
        setMatchingDate('');
        setMessage({
          type: 'info',
          content: '설정된 매칭 시간이 없습니다.'
        });
      }
    } catch (error) {
      console.error('매칭 시간 조회 실패:', error);
      setMessage({ 
        type: 'error', 
        content: '매칭 시간 조회에 실패했습니다. 다시 시도해 주세요.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSignupStatus = async () => {
    try {
      console.log('회원가입 상태 정보 가져오기 시작');
      const response = await fetch('/api/admin/signup-control');
      
      if (!response.ok) {
        throw new Error(`API 응답 오류: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('회원가입 상태 정보:', data);
      
      if (data.isSignupEnabled !== undefined) {
        setIsSignupEnabled(data.isSignupEnabled);
        setMessage({
          type: 'info',
          content: `현재 회원가입이 ${data.isSignupEnabled ? '활성화' : '비활성화'} 상태입니다.`
        });
      } else {
        setMessage({
          type: 'error',
          content: '회원가입 상태 정보를 불러올 수 없습니다.'
        });
      }
    } catch (error) {
      console.error('회원가입 상태 조회 실패:', error);
      setMessage({ 
        type: 'error', 
        content: '회원가입 상태 조회에 실패했습니다.' 
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      console.log('매칭 시간 설정 요청:', matchingDate);
      
      const response = await fetch('/api/admin/matching-time', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ matchingTime: matchingDate }),
      });

      if (!response.ok) {
        throw new Error(`API 응답 오류: ${response.status}`);
      }

      const data = await response.json();
      console.log('매칭 시간 설정 응답:', data);

      setMessage({
        type: 'success',
        content: '매칭 시간이 성공적으로 설정되었습니다.'
      });
    } catch (error) {
      console.error('매칭 시간 설정 실패:', error);
      setMessage({
        type: 'error',
        content: '매칭 시간 설정에 실패했습니다. 다시 시도해 주세요.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSignup = async () => {
    try {
      setIsLoading(true);
      console.log(`회원가입 상태 변경 요청: ${isSignupEnabled ? '비활성화' : '활성화'}`);
      
      const response = await fetch('/api/admin/signup-control', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isSignupEnabled: !isSignupEnabled }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API 응답 오류: ${response.status}`);
      }

      const data = await response.json();
      console.log('회원가입 상태 변경 응답:', data);

      if (data.success) {
        setIsSignupEnabled(!isSignupEnabled);
        setMessage({
          type: 'success',
          content: `회원가입이 ${!isSignupEnabled ? '활성화' : '비활성화'}되었습니다.`
        });
      } else {
        throw new Error('회원가입 상태 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('회원가입 상태 변경 중 오류 발생:', error);
      setMessage({
        type: 'error',
        content: error instanceof Error ? error.message : '회원가입 상태 변경에 실패했습니다.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold mb-4">매칭 시간 설정</h2>
        <form onSubmit={handleSubmit} className="max-w-md space-y-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              매칭 시간
            </label>
            <input
              type="datetime-local"
              value={matchingDate}
              onChange={(e) => setMatchingDate(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-primary-DEFAULT focus:border-transparent"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary-DEFAULT text-white py-2 px-4 rounded-md hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {isLoading ? '처리 중...' : '매칭 시간 설정'}
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
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                isSignupEnabled
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              } disabled:opacity-50`}
            >
              {isLoading ? '처리 중...' : isSignupEnabled ? '비활성화하기' : '활성화하기'}
            </button>
          </div>
        </div>
      </div>

      {/* 메시지 표시 */}
      {message.content && (
        <div className={`max-w-md p-4 rounded-lg ${
          message.type === 'error' ? 'bg-red-100 text-red-700' :
          message.type === 'success' ? 'bg-green-100 text-green-700' :
          'bg-blue-100 text-blue-700'
        }`}>
          {message.content}
        </div>
      )}
    </div>
  );
} 