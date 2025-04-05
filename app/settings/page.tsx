'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HomeIcon, ChatBubbleLeftRightIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { createClient as supabaseAdminClient } from '@supabase/supabase-js';

export default function Settings() {
  const router = useRouter();
  const { user } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [notifications, setNotifications] = useState({
    matching: true,
    events: true
  });
  const [password, setPassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  // 페이지 이동 함수들
  const handleGoToProfile = () => router.push('/profile');
  const handleGoToHome = () => router.push('/home');
  const handleGoToSettings = () => router.push('/settings');

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.error('토큰이 없습니다.');
        router.push('/');
        return;
      }

      // Nest.js 로그아웃 API 호출
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('로그아웃 처리에 실패했습니다.');
      }

      // 로컬 스토리지 클리어
      try {
        localStorage.clear();
      } catch (e) {
        console.error('로컬 스토리지 클리어 중 오류:', e);
      }

      // 쿠키 클리어 (모든 쿠키 삭제)
      document.cookie.split(';').forEach(cookie => {
        document.cookie = cookie
          .replace(/^ +/, '')
          .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
      });

      console.log('로그아웃 성공');
      
      // 홈페이지로 리디렉션
      router.push('/');
    } catch (error) {
      console.error('로그아웃 처리 중 오류:', error);
      alert('로그아웃 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      if (!password.trim()) {
        setDeleteError('비밀번호를 입력해주세요.');
        return;
      }

      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.error('토큰이 없습니다.');
        router.push('/');
        return;
      }

      // Nest.js API 호출
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/withdraw`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '회원 탈퇴 처리에 실패했습니다.');
      }

      // 로컬 스토리지 클리어
      localStorage.clear();

      // 쿠키 클리어
      document.cookie.split(';').forEach(cookie => {
        document.cookie = cookie
          .replace(/^ +/, '')
          .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
      });

      // 홈페이지로 리다이렉션
      router.push('/');
      
    } catch (error) {
      console.error('회원 탈퇴 중 오류:', error);
      setDeleteError(error instanceof Error ? error.message : '회원 탈퇴 처리 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 헤더 */}
      <div className="bg-white border-b">
        <div className="max-w-lg mx-auto px-4 py-6">
          <h1 className="text-h1 text-center">설정</h1>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* 프로필 수정 섹션 */}
        <div className="card">
          <h2 className="text-h2 mb-4">프로필 관리</h2>
          <button
            onClick={() => router.push('/settings/profile')}
            className="btn-primary w-full"
          >
            프로필 조회
          </button>
        </div>

        {/* 알림 설정 섹션 */}
        <div className="card space-y-4">
          <h2 className="text-h2">알림 설정</h2>
          <div className="space-y-4 bg-gray-50 p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 font-medium">매칭 완료 알림</span>
              <button
                onClick={() => setNotifications(prev => ({
                  ...prev,
                  matching: !prev.matching
                }))}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
                  ${notifications.matching ? 'bg-[#6C5CE7]' : 'bg-gray-300'}`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out
                    ${notifications.matching ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700 font-medium">이벤트 알림</span>
              <button
                onClick={() => setNotifications(prev => ({
                  ...prev,
                  events: !prev.events
                }))}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
                  ${notifications.events ? 'bg-[#6C5CE7]' : 'bg-gray-300'}`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out
                    ${notifications.events ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* 계정 관리 섹션 */}
        <div className="card space-y-4">
          <h2 className="text-h2">계정 관리</h2>
          <div className="flex gap-2">
            <button
              onClick={handleLogout}
              className="btn-secondary w-full"
            >
              로그아웃
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="btn-secondary w-full text-red-500 border-red-500 hover:bg-red-500 hover:text-white"
            >
              회원 탈퇴
            </button>
          </div>
        </div>
      </div>

      {/* 회원 탈퇴 확인 모달 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full space-y-4">
            <h3 className="text-h2 text-center">정말 떠나실 건가요? 😢</h3>
            <p className="text-gray-600 text-center">
              탈퇴하시면 모든 정보가 삭제되며 복구할 수 없습니다.
            </p>
            <div className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  비밀번호 확인
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setDeleteError('');
                  }}
                  placeholder="비밀번호를 입력해주세요"
                  className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-purple-300 focus:outline-none transition-all"
                />
                {deleteError && (
                  <p className="mt-1 text-sm text-red-600">{deleteError}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setPassword('');
                    setDeleteError('');
                  }}
                  className="btn-secondary w-full"
                >
                  취소
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="btn-primary w-full bg-red-500 hover:bg-red-600"
                >
                  탈퇴하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 하단 네비게이션 */}
      <nav 
              className="fixed bottom-0 left-0 right-0 bg-white border-t py-3 shadow-lg transition-all duration-200 ease-in-out" 
              role="navigation" 
              aria-label="메인 네비게이션"
            >
              <div className="max-w-lg mx-auto px-6 flex justify-around items-center">
                <button
                  onClick={handleGoToHome}
                  className="flex flex-col items-center text-[#636E72] hover:text-[#6C5CE7] transform hover:scale-105 transition-all duration-200"
                  type="button"
                  aria-label="홈으로 이동"
                >
                  <HomeIcon className="w-7 h-7" aria-hidden="true" />
                  <span className="text-sm font-medium mt-1">홈</span>
                </button>
                <button
                  onClick={() => router.push('/community')}
                  className="flex flex-col items-center text-[#636E72] hover:text-[#6C5CE7] transform hover:scale-105 transition-all duration-200"
                  type="button"
                  aria-label="커뮤니티로 이동"
                >
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                  <span className="text-sm font-medium mt-1">커뮤니티</span>
                </button>
                <button
                  onClick={handleGoToSettings}
                  className="flex flex-col items-center text-[#6C5CE7] transform hover:scale-105 transition-all duration-200"
                  type="button"
                  aria-label="설정으로로 이동"
                >
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-sm font-medium mt-1">설정</span>
                </button>
              </div>
            </nav>
    </div>
  );
} 