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
import { useAuth } from '@/contexts/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ADMIN_EMAIL } from '@/utils/config';

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClientComponentClient();
  const [hasProfile, setHasProfile] = useState(false);
  const [hasIdealType, setHasIdealType] = useState(false);
  const [userName, setUserName] = useState('게스트');
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthAndProfile = async () => {
      try {
        console.log('홈 페이지 로딩 시작');
        console.log('AuthContext 사용자 정보:', user);
        
        // 세션 상태 확인
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('세션 확인 오류:', sessionError);
          setIsLoading(false);
          return;
        }

        if (!session) {
          console.log('세션이 없습니다. 로그인 필요');
          // 미들웨어에서 리다이렉션을 처리하도록 둠
          setIsLoading(false);
          return;
        }

        console.log('세션 확인 완료:', session.user.id);

        // ✅ Admin이면 /admin/community로 리다이렉트
        if (session.user.email === ADMIN_EMAIL) {
          console.log('✅ Admin 계정 로그인, /admin/community로 이동');
          router.replace('/admin/community'); // ✅ Admin 계정이면 즉시 이동
          return;
        }

        // 프로필 조회
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        // 프로필 에러 처리
          if (profileError) {
            // PGRST116은 row not found 에러로, 프로필이 없는 정상적인 상황
            if (profileError.code === 'PGRST116') {
              console.log('프로필이 없습니다. 온보딩 모달을 표시합니다.');
              setShowOnboardingModal(true);
              setIsLoading(false);
              return;
            }
            
            console.error('프로필 조회 오류:', profileError);
            setIsLoading(false);
            return;
          }

        // 프로필이 있는 경우 상태 업데이트
        if (profile) {
          console.log('프로필 조회 성공:', profile);
          setUserName(profile.name || '게스트');
          setHasProfile(true);
          localStorage.setItem('profile', JSON.stringify(profile));
          
          // 이상형 설정 확인
          const idealType = localStorage.getItem('idealType');
          setHasIdealType(!!idealType);
          console.log('이상형 설정 상태:', !!idealType);
        } else {
          // 프로필이 없는 경우
          console.log('프로필 데이터가 없습니다. 온보딩 모달 표시');
          setShowOnboardingModal(true);
        }
      } catch (error) {
        console.error('프로필 확인 중 오류 발생:', error);
      } finally {
        // 로딩 상태 종료
        console.log('홈 페이지 로딩 완료');
        setIsLoading(false);
      }
    };

    // 상태 초기화
    setIsLoading(true);
    checkAuthAndProfile();
  }, [supabase, user]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {isLoading ? (
        <div className="flex justify-center items-center h-screen">
          <div className="text-center">
            <p className="text-lg text-gray-600">로딩 중...</p>
          </div>
        </div>
      ) : (
        <>
          {/* 온보딩 모달 */}
          {showOnboardingModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-sm mx-4 space-y-4">
                <h2 className="text-h2 text-center">환영합니다! 👋</h2>
                <p className="text-gray-600 text-center">
                  매칭 서비스를 이용하기 위해서는<br />
                  먼저 기본 정보를 입력해주세요.
                </p>
                <button
                  onClick={() => {
                    setShowOnboardingModal(false);
                    router.replace('/onboarding');
                  }}
                  className="btn-primary w-full"
                >
                  시작하기
                </button>
              </div>
            </div>
          )}

          {/* 프로필 설정 모달 */}
          {showProfileModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-sm mx-4 space-y-4">
                <h2 className="text-h2 text-center">프로필을 설정해주세요 ✨</h2>
                <p className="text-gray-600 text-center">
                  나를 더 잘 표현할 수 있는<br />
                  프로필을 작성하고 매칭을 시작해보세요!
                </p>
                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    router.push('/profile');
                  }}
                  className="btn-primary w-full"
                >
                  프로필 설정하기
                </button>
              </div>
            </div>
          )}

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

            {/* 매칭 상태 */}
            <div className="card bg-white p-4 space-y-4">
              <h2 className="text-h2">매칭 상태</h2>
              <p className="text-gray-600">아직 매칭이 시작되지 않았어요.</p>
              <button className="btn-secondary w-full">
                재매칭 신청하기
              </button>
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
          </div>

          {/* 하단 네비게이션 */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t py-2">
            <div className="max-w-lg mx-auto px-4 flex justify-around items-center">
              <button
                onClick={() => {
                  router.push('/home');
                }}
                className="flex flex-col items-center text-primary-DEFAULT"
              >
                <HomeIcon className="w-6 h-6" />
                <span className="text-sm mt-1">홈</span>
              </button>
              <button
                onClick={() => {
                  router.push('/community');
                }}
                className="flex flex-col items-center text-gray-400 hover:text-primary-DEFAULT"
              >
                <ChatBubbleLeftRightIcon className="w-6 h-6" />
                <span className="text-sm mt-1">커뮤니티</span>
              </button>
              <button
                onClick={() => {
                  router.push('/settings');
                }}
                className="flex flex-col items-center text-gray-400 hover:text-primary-DEFAULT"
              >
                <Cog6ToothIcon className="w-6 h-6" />
                <span className="text-sm mt-1">설정</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 