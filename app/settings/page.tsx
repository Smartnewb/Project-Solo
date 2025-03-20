'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HomeIcon, ChatBubbleLeftRightIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';

export default function Settings() {
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [notifications, setNotifications] = useState({
    matching: true,
    events: true
  });

  const handleLogout = () => {
    // TODO: 로그아웃 로직 구현
    router.push('/');
  };

  const handleDeleteAccount = () => {
    // TODO: 회원 탈퇴 로직 구현
    router.push('/');
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
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">매칭 완료 알림</span>
              <button
                onClick={() => setNotifications(prev => ({
                  ...prev,
                  matching: !prev.matching
                }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out
                  ${notifications.matching ? 'bg-primary-DEFAULT' : 'bg-gray-200'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out
                    ${notifications.matching ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">이벤트 알림</span>
              <button
                onClick={() => setNotifications(prev => ({
                  ...prev,
                  events: !prev.events
                }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out
                  ${notifications.events ? 'bg-primary-DEFAULT' : 'bg-gray-200'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out
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
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
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
      )}

      {/* 하단 네비게이션 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t py-2">
        <div className="max-w-lg mx-auto px-4 flex justify-around items-center">
          <button
            onClick={() => router.push('/home')}
            className="flex flex-col items-center text-gray-400"
          >
            <HomeIcon className="w-6 h-6" />
            <span className="text-sm mt-1">홈</span>
          </button>
          <button
            onClick={() => router.push('/community')}
            className="flex flex-col items-center text-gray-400"
          >
            <ChatBubbleLeftRightIcon className="w-6 h-6" />
            <span className="text-sm mt-1">커뮤니티</span>
          </button>
          <button
            onClick={() => router.push('/settings')}
            className="flex flex-col items-center text-primary-DEFAULT"
          >
            <Cog6ToothIcon className="w-6 h-6" />
            <span className="text-sm mt-1">설정</span>
          </button>
        </div>
      </div>
    </div>
  );
} 