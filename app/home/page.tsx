'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ActiveUsersCounter from '../components/ActiveUsersCounter';
import MatchingCountdown from '../components/MatchingCountdown';
import DatingTip from '../components/DatingTip';
import MatchPrediction from '../components/MatchPrediction';
import DateSpotRecommendation from '../components/DateSpotRecommendation';
import PopularQuestions from '../components/PopularQuestions';
import SuccessStories from '../components/SuccessStories';
import { HomeIcon, ChatBubbleLeftRightIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';

export default function Home() {
  const router = useRouter();
  const [hasProfile, setHasProfile] = useState(false);
  const [hasIdealType, setHasIdealType] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    // localStorage에서 프로필과 이상형 설정 상태 확인
    const profile = localStorage.getItem('profile');
    const idealType = localStorage.getItem('idealType');
    
    setHasProfile(!!profile);
    setHasIdealType(!!idealType);

    // 유저 이름 가져오기
    if (profile) {
      const profileData = JSON.parse(profile);
      setUserName(profileData.name || '게스트');
    } else {
      setUserName('게스트');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 상단 헤더 */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="text-xl font-bold text-primary-DEFAULT">
              Project-Solo
            </div>
            <div className="text-gray-700 font-medium">
              {userName}님, 안녕하세요!
            </div>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* 프로필 작성 알림 */}
        {!hasProfile && (
          <div className="card bg-white p-4 space-y-4">
            <h2 className="text-h2">프로필을 작성해주세요!</h2>
            <p className="text-gray-600">
              나를 더 잘 표현할 수 있는 프로필을 작성해주세요.
              매칭의 정확도를 높일 수 있어요!
            </p>
            <button
              onClick={() => router.push('/profile')}
              className="btn-primary w-full"
            >
              프로필 작성하기
            </button>
          </div>
        )}

        {/* 이상형 설정 알림 */}
        {!hasIdealType && (
          <div className="card bg-white p-4 space-y-4">
            <h2 className="text-h2">이상형을 설정해주세요!</h2>
            <p className="text-gray-600">
              나에게 딱 맞는 상대를 찾기 위해 이상형을 설정해주세요.
              더 정확한 매칭을 위해 꼭 필요해요!
            </p>
            <button
              onClick={() => router.push('/ideal-type')}
              className="btn-primary w-full"
            >
              이상형 설정하기
            </button>
          </div>
        )}

        {/* 현재 참여자 수 */}
        <div className="card bg-white p-4 overflow-visible">
          <ActiveUsersCounter />
        </div>

        {/* 매칭 시작까지 남은 시간 */}
        <div className="card bg-white p-4">
          <MatchingCountdown />
        </div>

        {/* 실시간 인기 질문 */}
        <PopularQuestions />

        {/* 소개팅 성공 후기 */}
        <SuccessStories />

        {/* 오늘의 소개팅 팁 */}
        <DatingTip />

        {/* 매칭 상대 예측 */}
        <MatchPrediction />

        {/* 데이트 장소 추천 */}
        <DateSpotRecommendation />

        {/* 매칭 상태 */}
        <div className="card bg-white p-4 space-y-4">
          <h2 className="text-h2">매칭 상태</h2>
          <p className="text-gray-600">아직 매칭이 시작되지 않았어요.</p>
          <button className="btn-secondary w-full">
            재매칭 신청하기
          </button>
        </div>
      </div>

      {/* 하단 네비게이션 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t py-2">
        <div className="max-w-lg mx-auto px-4 flex justify-around items-center">
          <button
            onClick={() => router.push('/home')}
            className="flex flex-col items-center text-primary-DEFAULT"
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
            className="flex flex-col items-center text-gray-400"
          >
            <Cog6ToothIcon className="w-6 h-6" />
            <span className="text-sm mt-1">설정</span>
          </button>
        </div>
      </div>
    </div>
  );
} 