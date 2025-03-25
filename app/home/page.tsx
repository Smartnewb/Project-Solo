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
import { HomeIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/utils/supabase/client';
import { ADMIN_EMAIL } from '@/utils/config';
import type { Database } from '../types/database.types';

export default function Home() {
  const supabase = createClient();
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();

  const [hasProfile, setHasProfile] = useState(false);
  const [hasIdealType, setHasIdealType] = useState(false);
  const [userName, setUserName] = useState('게스트');
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdditionalInfoModal, setShowAdditionalInfoModal] = useState(false);

  // 페이지 이동 함수들
  const handleGoToProfile = () => router.push('/profile');
  const handleGoToHome = () => router.push('/home');
  const handleGoToSettings = () => router.push('/settings');

  // AuthContext에서 profile 데이터가 변경될 때마다 userName 업데이트
  useEffect(() => {
    console.log('⚡️ 컴포넌트 마운트 - 프로필 새로고침');
    refreshProfile(); // 명시적으로 프로필 데이터 새로고침
  }, []); // 컴포넌트 마운트 시 한 번만 실행, refreshProfile 의존성 제거

  useEffect(() => {
    console.log('AuthContext 상태 변경 감지:', { user, profile });
    
    if (profile) {
      if (profile.name && userName !== profile.name) { // 이름이 다를 때만 업데이트
        setUserName(profile.name);
        console.log('⚡️ 사용자 이름을 설정했습니다:', profile.name);
      } else {
        console.log('⚠️ 프로필에 이름이 없습니다');
      }
    } else {
      console.log('❌ 프로필 데이터가 없습니다');
    }
  }, [profile]); // user 의존성 제거, profile만 감시

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

        // 세션이 있는 경우, 프로필 확인
        if (session) {
          console.log('세션이 있습니다. 프로필을 확인합니다.');
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

          if (error) {
            console.error('프로필 조회 에러:', error);
            setHasProfile(false);
            setShowOnboardingModal(true);
          } else if (profile) {
            console.log('프로필이 있습니다:', profile);
            setHasProfile(true);
            setShowOnboardingModal(false);
            
            // 이상형 정보가 있는지 확인 (personalites 등의 필드가 있으면 이상형이 이미 설정됨)
            const idealTypeFields = ['personalities', 'datingStyles', 'idealLifestyles', 'interests'];
            const hasIdealTypeInfo = idealTypeFields.some(field => profile[field] && 
              (Array.isArray(profile[field]) ? profile[field].length > 0 : Boolean(profile[field])));
            
            setHasIdealType(hasIdealTypeInfo);
            console.log('이상형 정보 확인:', hasIdealTypeInfo ? '설정됨' : '미설정');
            
            // 추가 프로필 정보가 필요한지 확인
            const requiredFields = ['height', 'personalities'];
            const needsAdditionalInfo = requiredFields.some(field => !profile[field]);
            
            if (needsAdditionalInfo) {
              console.log('추가 프로필 정보가 필요합니다.');
              setShowAdditionalInfoModal(true);
            }
          } else {
            console.log('프로필이 없습니다.');
            setHasProfile(false);
            setShowOnboardingModal(true);
          }
        }
      } catch (error) {
        console.error('프로필 확인 중 오류 발생:', error);
      } finally {
        // 로딩 상태 종료
        console.log('홈 페이지 로딩 완료');
        setIsLoading(false);
      }
    };

    // 5초 타임아웃 설정 - 브라우저를 나갔다 들어왔을 때 무한 로딩 방지
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.log('타임아웃으로 인한 로딩 상태 해제');
        setIsLoading(false);
      }
    }, 5000);

    // 상태 초기화
    setIsLoading(true);
    checkAuthAndProfile();
    
    // 클린업 함수에서 타임아웃 제거
    return () => clearTimeout(timeoutId);
  }, [router, supabase, user]);

  return (
    <div className="min-h-screen bg-[#F8FAFD] pb-20">
      {isLoading ? (
        <div className="flex justify-center items-center h-screen">
          <div className="animate-pulse space-y-4 text-center">
            <div className="h-12 w-12 rounded-full bg-[#6C5CE7]/20 mx-auto" />
            <p className="text-[#636E72]">잠시만 기다려주세요...</p>
          </div>
        </div>
      ) : (
        <>
          {/* 온보딩 모달 */}
          {showOnboardingModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-8 max-w-sm mx-4 space-y-6 shadow-xl transform transition-all">
                <div className="text-center space-y-4">
                  <div className="text-5xl">👋</div>
                  <h2 className="text-2xl font-bold text-[#2D3436]">환영합니다!</h2>
                  <p className="text-[#636E72] leading-relaxed">
                    매칭 서비스를 이용하기 위해서는<br />
                    먼저 기본 정보를 입력해주세요.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowOnboardingModal(false);
                    router.replace('/onboarding');
                  }}
                  className="btn-primary w-full py-4"
                  type="button"
                >
                  시작하기
                </button>
              </div>
            </div>
          )}

          {/* 프로필 설정 모달 */}
          {showProfileModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-8 max-w-sm mx-4 space-y-6 shadow-xl transform transition-all">
                <div className="text-center space-y-4">
                  <div className="text-5xl">✨</div>
                  <h2 className="text-2xl font-bold text-[#2D3436]">프로필을 설정해주세요</h2>
                  <p className="text-[#636E72] leading-relaxed">
                    나를 더 잘 표현할 수 있는<br />
                    프로필을 작성하고 매칭을 시작해보세요!
                  </p>
                </div>
                <button
                  onClick={handleGoToProfile}
                  className="btn-primary w-full py-4"
                  type="button"
                >
                  프로필 설정하기
                </button>
              </div>
            </div>
          )}

          {/* 추가 정보 모달 */}
          {showAdditionalInfoModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-8 max-w-sm mx-4 space-y-6 shadow-xl transform transition-all">
                <div className="text-center space-y-4">
                  <div className="text-5xl">🌟</div>
                  <h2 className="text-2xl font-bold text-[#2D3436]">추가 정보가 필요해요</h2>
                  <p className="text-[#636E72] leading-relaxed">
                    더 정확한 매칭을 위해<br />
                    몇 가지 정보를 더 입력해주세요.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowAdditionalInfoModal(false);
                    router.replace('/profile/additional');
                  }}
                  className="btn-primary w-full py-4"
                  type="button"
                >
                  추가 정보 입력하기
                </button>
              </div>
            </div>
          )}

          {/* 상단 헤더 */}
          <header className="bg-white shadow-sm sticky top-0 z-10">
            <div className="max-w-lg mx-auto px-6 py-4">
              <div className="flex justify-between items-center">
                <div className="text-2xl font-bold bg-gradient-to-r from-[#6C5CE7] to-[#A8A4E3] text-transparent bg-clip-text">
                  Project-Solo
                </div>
                <div className="text-[#2D3436] font-medium flex items-center gap-2" onClick={() => {
                    console.log('\u26a1\ufe0f 현재 프로필 데이터:', profile);
                    console.log('\u26a1\ufe0f 현재 유저 데이터:', user);
                  }}>
                  <div className="w-8 h-8 rounded-full bg-[#6C5CE7] text-white flex items-center justify-center font-bold cursor-pointer">
                    {profile && profile.name && profile.name.length > 0 ? profile.name[0].toUpperCase() : '?'}
                  </div>
                  <span>
                    {profile && profile.name ? profile.name : userName}님
                  </span>
                </div>
              </div>
            </div>
          </header>

          {/* 메인 컨텐츠 */}
          <main className="max-w-lg mx-auto p-6 space-y-6" role="main">
            {/* 프로필 작성 알림 */}
            {!hasProfile && (
              <section className="card space-y-6 transform transition-all hover:scale-[1.02] bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#6C5CE7]/10 flex items-center justify-center transform transition-all duration-200 hover:rotate-12">
                      <svg className="w-7 h-7 text-[#6C5CE7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-[#2D3436] tracking-tight">프로필을 작성해주세요!</h2>
                  </div>
                  <p className="text-[#636E72] leading-relaxed text-lg">
                    나를 더 잘 표현할 수 있는 프로필을 작성해주세요.
                    매칭의 정확도를 높일 수 있어요!
                  </p>
                  <button
                    onClick={handleGoToProfile}
                    className="btn-primary w-full py-4 flex items-center justify-center gap-3 bg-[#6C5CE7] text-white rounded-xl font-medium transform transition-all duration-200 hover:bg-[#5849BE] hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7] focus:ring-offset-2"
                    type="button"
                  >
                    <span className="text-lg">프로필 작성하기</span>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </section>
            )}

            {/* 이상형 설정 알림 */}
            {!hasIdealType && (
              <section className="card space-y-6 transform transition-all hover:scale-[1.02] bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#FD79A8]/10 flex items-center justify-center transform transition-all duration-200 hover:rotate-12">
                      <svg className="w-7 h-7 text-[#FD79A8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-[#2D3436] tracking-tight">이상형을 설정해주세요!</h2>
                  </div>
                  <p className="text-[#636E72] leading-relaxed text-lg">
                    나에게 딱 맞는 상대를 찾기 위해 이상형을 설정해주세요.
                    더 정확한 매칭을 위해 꼭 필요해요!
                  </p>
                  <button
                    onClick={() => router.push('/ideal-type')}
                    className="btn-primary w-full py-4 flex items-center justify-center gap-3 bg-[#FD79A8] text-white rounded-xl font-medium transform transition-all duration-200 hover:bg-[#FF65A3] hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#FD79A8] focus:ring-offset-2"
                    type="button"
                    aria-label="이상형 설정 페이지로 이동"
                  >
                    <span className="text-lg">이상형 설정하기</span>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </section>
            )}

            {/* 현재 참여자 수 */}
            <section className="card space-y-6 transform transition-all hover:scale-[1.02] bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#00B894]/10 flex items-center justify-center transform transition-all duration-200 hover:rotate-12">
                    <svg className="w-7 h-7 text-[#00B894]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-[#2D3436] tracking-tight">현재 소개팅 신청자 수</h2>
                </div>
                <div className="bg-[#00B894]/5 rounded-xl p-4">
                  <ActiveUsersCounter />
                </div>
              </div>
            </section>

            {/* 매칭 시작까지 남은 시간 */}
            <section className="card space-y-6 transform transition-all hover:scale-[1.02] bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#0984E3]/10 flex items-center justify-center transform transition-all duration-200 hover:rotate-12">
                    <svg className="w-7 h-7 text-[#0984E3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-[#2D3436] tracking-tight">매칭 시작까지</h2>
                </div>
                <div className="bg-[#0984E3]/5 rounded-xl p-4">
                  <MatchingCountdown />
                </div>
              </div>
            </section>

            {/* 매칭 상태 */}
            <section className="card space-y-6 transform transition-all hover:scale-[1.02] bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#74B9FF]/10 flex items-center justify-center transform transition-all duration-200 hover:rotate-12">
                    <svg className="w-7 h-7 text-[#74B9FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-[#2D3436] tracking-tight">매칭 상태</h2>
                </div>
                <div className="bg-[#74B9FF]/5 rounded-xl p-4">
                  <p className="text-[#636E72] leading-relaxed text-lg">아직 매칭이 시작되지 않았어요.</p>
                </div>
                <button
                  className="btn-secondary w-full py-4 flex items-center justify-center gap-3 bg-[#74B9FF] text-white rounded-xl font-medium transform transition-all duration-200 hover:bg-[#5FA8FF] hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#74B9FF] focus:ring-offset-2"
                  type="button"
                >
                  <span className="text-lg">재매칭 신청하기</span>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </section>

            {/* 실시간 인기 질문 */}
            <section className="card space-y-6 transform transition-all hover:scale-[1.02]">
              <PopularQuestions />
            </section>

            {/* 소개팅 성공 후기 */}
            <section className="card space-y-6 transform transition-all hover:scale-[1.02]">
              <SuccessStories />
            </section>

            {/* 오늘의 소개팅 팁 */}
            <section className="card space-y-6 transform transition-all hover:scale-[1.02]">
              <DatingTip />
            </section>

            {/* 매칭 상대 예측 */}
            <section className="card space-y-6 transform transition-all hover:scale-[1.02]">
              <MatchPrediction />
            </section>

            {/* 데이트 장소 추천 */}
            <section className="card space-y-6 transform transition-all hover:scale-[1.02]">
              <DateSpotRecommendation />
            </section>

            {/* 하단 네비게이션 */}
            <nav 
              className="fixed bottom-0 left-0 right-0 bg-white border-t py-3 shadow-lg transition-all duration-200 ease-in-out" 
              role="navigation" 
              aria-label="메인 네비게이션"
            >
              <div className="max-w-lg mx-auto px-6 flex justify-around items-center">
                <button
                  onClick={handleGoToHome}
                  className="flex flex-col items-center text-[#6C5CE7] transform hover:scale-105 transition-all duration-200"
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
                  className="flex flex-col items-center text-[#636E72] hover:text-[#6C5CE7] transform hover:scale-105 transition-all duration-200"
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
          </main>
        </>
      )}
    </div>
  );
}
