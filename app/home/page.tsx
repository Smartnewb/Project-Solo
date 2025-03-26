'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ActiveUsersCounter from '../components/ActiveUsersCounter';
import MatchingCountdown from '../components/MatchingCountdown';
import DatingTip from '../components/DatingTip';
import MatchPrediction from '../components/MatchPrediction';
import DateSpotRecommendation from '../components/DateSpotRecommendation';
import PopularQuestions from '../components/PopularQuestions';
import SuccessStories from '../components/SuccessStories';
import { HomeIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/utils/supabase/client';
import { ADMIN_EMAIL } from '@/utils/config';
import type { Profile } from '@/contexts/AuthContext';
import type { Database } from '../types/database.types';

interface MatchResult {
  instagram_id: string | null;
  score: number;
}

export default function Home() {
  const supabase = createClient();
  const router = useRouter();
  const { user, profile } = useAuth();

  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdditionalInfoModal, setShowAdditionalInfoModal] = useState(false);
  const [hasUserPreferences, setHasUserPreferences] = useState(false);
  
  // 리매칭 관련 상태
  const [showRematchModal, setShowRematchModal] = useState(false);
  const [showRematchWarningModal, setShowRematchWarningModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const accountNumberRef = useRef<HTMLParagraphElement>(null);
  const [isMatchingTimeOver, setIsMatchingTimeOver] = useState(false);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);

  // 사용자 선호도 정보 조회
  const checkUserPreferences = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('선호도 정보 조회 오류:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('선호도 정보 확인 중 오류:', error);
      return false;
    }
  };

  // 페이지 이동 함수들
  const handleGoToProfile = () => router.push('/profile');
  const handleGoToHome = () => router.push('/home');
  const handleGoToSettings = () => router.push('/settings');
  
  // 계좌번호 복사 기능
  const copyAccountNumber = () => {
    navigator.clipboard.writeText("카카오뱅크 3333-12-3456789")
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch(err => {
        console.error('계좌번호 복사 실패:', err);
      });
  };
  
  // 리매칭 신청 처리 함수
  const handleRematchRequest = () => {
    if (!profile) return;

    const requiredFields = ['height', 'personalities', 'dating_styles'] as const;
    const hasRequiredFields = requiredFields.every(field => {
      const value = profile[field];
      return value && (Array.isArray(value) ? value.length > 0 : Boolean(value));
    });
    
    if (!hasRequiredFields) {
      setShowRematchWarningModal(true);
      return;
    }
    
    setShowRematchModal(true);
  };
  
  // 리매칭 확인 처리 
  const handleConfirmRematch = async () => {
    try {
      setShowRematchModal(false);
      setNotificationMessage('리매칭 신청이 완료되었습니다. 다음 매칭을 기대해주세요!');
      setShowNotificationModal(true);
      
      // matching_requests 테이블에 레코드 추가
      const { data, error } = await supabase
        .from('matching_requests')
        .insert([
          { 
            user_id: user?.id,
            status: 'pending',
            preferred_date: new Date().toISOString().split('T')[0],
            preferred_time: '19:00', // 기본 소개팅 시간
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]);
      
      if (error) {
        console.error('리매칭 요청 DB 저장 오류:', error);
        throw new Error('리매칭 요청 처리 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('리매칭 요청 오류:', error);
      setNotificationMessage('리매칭 요청 중 오류가 발생했습니다.');
      setShowNotificationModal(true);
    }
  };

  // 매칭 시간 상태 업데이트 핸들러
  const handleMatchingTimeUpdate = (isOver: boolean) => {
    setIsMatchingTimeOver(isOver);
  };

  // 매칭 결과 조회 함수
  const fetchMatchResult = async () => {
    if (!user) return;

    try {
      // 1. matches 테이블에서 현재 사용자의 매칭 정보 조회
      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .select('user1_id, user2_id, score')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .single();

      if (matchError || !matchData) {
        console.error('매칭 결과 조회 실패:', matchError);
        return;
      }

      // 2. 상대방의 user_id 찾기
      const partnerId = matchData.user1_id === user.id ? matchData.user2_id : matchData.user1_id;

      // 3. 상대방의 프로필에서 instagram_id 조회
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('instagram_id')
        .eq('user_id', partnerId)
        .single();

      if (profileError) {
        console.error('프로필 조회 실패:', profileError);
        return;
      }

      setMatchResult({
        instagram_id: profileData.instagram_id,
        score: matchData.score
      });
    } catch (error) {
      console.error('매칭 결과 조회 중 오류:', error);
    }
  };

  // 인스타 ID 복사 함수
  const copyInstagramId = async (instagramId: string) => {
    try {
      await navigator.clipboard.writeText(instagramId);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('복사 실패:', err);
    }
  };

  // 초기 상태 설정
  useEffect(() => {
    const initializeHome = async () => {
      try {
        setIsLoading(true);

        if (user?.email === ADMIN_EMAIL) {
          router.replace('/admin/community');
          return;
        }

        // 프로필이 없으면 프로필 작성 모달 표시
        setShowOnboardingModal(!profile);

        // 프로필이 있고 user_id가 있는 경우에만 선호도 정보 확인
        if (profile && user?.id) {
          const hasPreferences = await checkUserPreferences(user.id);
          setHasUserPreferences(hasPreferences);
        }
      } catch (error) {
        console.error('홈 페이지 초기화 중 오류:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeHome();
  }, [user, profile, router]);

  // 매칭 시간이 되면 결과 조회
  useEffect(() => {
    if (isMatchingTimeOver) {
      fetchMatchResult();
    }
  }, [isMatchingTimeOver]);

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
                    router.replace('/profile');
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
                <div className="text-[#2D3436] font-medium flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#6C5CE7] text-white flex items-center justify-center font-bold cursor-pointer">
                    {profile?.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <span>
                    {profile?.name || '게스트'}님
                  </span>
                </div>
              </div>
            </div>
          </header>

          {/* 메인 컨텐츠 */}
          <main className="max-w-lg mx-auto p-6 space-y-6" role="main">
            {/* 프로필 작성 알림 */}
            {!profile && (
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
            {profile && !hasUserPreferences && (
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
                  <MatchingCountdown onTimeOver={handleMatchingTimeUpdate} />
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
                  <p className="text-[#636E72] leading-relaxed text-lg">
                    {isMatchingTimeOver ? (
                      matchResult ? (
                        <div className="space-y-2">
                          <p>매칭이 완료되었습니다! 🎉</p>
                          <button
                            onClick={() => matchResult.instagram_id && copyInstagramId(matchResult.instagram_id)}
                            className="text-blue-500 hover:text-blue-700 underline focus:outline-none"
                          >
                            {isCopied ? "복사됨!" : `Instagram ID: ${matchResult.instagram_id || '미설정'}`}
                          </button>
                          <p className="text-sm text-gray-500">
                            매칭 점수: {matchResult.score}점
                          </p>
                        </div>
                      ) : (
                        '매칭에 실패하였습니다.'
                      )
                    ) : (
                      '매칭 카운트 다운이 지나면 공개됩니다.'
                    )}
                  </p>
                </div>
                {isMatchingTimeOver && (  // 매칭 시간이 되었을 때만 버튼 표시
                  <button
                    onClick={handleRematchRequest}
                    className="btn-secondary w-full py-4 flex items-center justify-center gap-3 bg-[#74B9FF] text-white rounded-xl font-medium transform transition-all duration-200 hover:bg-[#5FA8FF] hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#74B9FF] focus:ring-offset-2"
                    type="button"
                  >
                    <span className="text-lg">재매칭 신청하기</span>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                )}
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
          
          {/* 리매치 모달 (매칭 결과 페이지와 동일한 스타일) */}
          {showRematchModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
                <button
                  onClick={() => setShowRematchModal(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
                
                <h3 className="text-xl font-bold mb-4">리매칭 신청</h3>
                
                <div className="mb-6">
                  <p className="mb-3">매칭 결과에 만족하지 않으신가요?</p>
                  <p className="mb-3">리매칭을 신청하시면 새로운 매칭을 받으실 수 있습니다.</p>
                  <div className="bg-yellow-50 p-4 rounded-md mb-4">
                    <p className="font-medium text-yellow-700 mb-2">참가비: 2,000원</p>
                    <div className="flex items-center">
                      <p className="text-sm text-gray-700 mr-2">계좌번호: 카카오뱅크 3333-12-3456789</p>
                      <button
                        onClick={copyAccountNumber}
                        className="text-xs bg-gray-200 hover:bg-gray-300 py-1 px-2 rounded"
                      >
                        {isCopied ? "복사됨" : "복사"}
                      </button>
                    </div>
                    <p className="text-sm text-gray-700 mt-2">예금주: 킹스 매크로</p>
                    <p 
                      ref={accountNumberRef} 
                      className="absolute opacity-0 pointer-events-none"
                    >
                      카카오뱅크 3333-12-3456789
                    </p>
                  </div>
                  <p className="text-sm text-gray-600">
                    * 입금 후 리매칭 신청이 완료됩니다. 매칭 시간에 새로운 매칭 결과를 확인해주세요.
                  </p>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={handleConfirmRematch}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded"
                  >
                    신청하기
                  </button>
                  <button
                    onClick={() => setShowRematchModal(false)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded"
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 알림 모달 */}
          {showNotificationModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <div className="text-center mb-4">
                  <p className="text-lg">{notificationMessage}</p>
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={() => setShowNotificationModal(false)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-6 rounded"
                  >
                    확인
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* 프로필 경고 모달 */}
          {showRematchWarningModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <div className="text-center mb-6">
                  <div className="text-5xl mb-4">⚠️</div>
                  <h3 className="text-xl font-bold mb-2">프로필 정보를 완성해주세요</h3>
                  <p className="text-gray-600">
                    매칭에 필요한 정보가 부족합니다. 프로필을 완성하고 재매칭 신청을 진행해주세요.
                  </p>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowRematchWarningModal(false);
                      router.push('/profile');
                    }}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded"
                  >
                    프로필 완성하기
                  </button>
                  <button
                    onClick={() => setShowRematchWarningModal(false)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded"
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
