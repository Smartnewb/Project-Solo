"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import ActiveUsersCounter from "../components/ActiveUsersCounter";
import MatchingCountdown from "../components/MatchingCountdown";
import DatingTip from "../components/DatingTip";
import MatchPrediction from "../components/MatchPrediction";
import DateSpotRecommendation from "../components/DateSpotRecommendation";
import PopularQuestions from "../components/PopularQuestions";
import SuccessStories from "../components/SuccessStories";
import { HomeIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/contexts/AuthContext";
import type { Profile } from "@/contexts/AuthContext";
import type { Database } from "../types/database.types";
import { Card, CardContent, CardHeader } from "@/shared/ui";
import { Button } from "@/shared/ui/button";
import { useModal } from "@/shared/hooks/use-modal";
import { PaymentModal, useRedirectTossPayment } from "@/features/toss-payment";
import { Payment } from "@/features/payment";
import { useRouteMemory } from "@/shared/hooks";
import { PaymentProduct } from "@/types/pay";
import Image from "next/image";
import { Counter } from "@/shared/ui/counter";
import { CheckIcon } from "@heroicons/react/24/outline";
import { RematchingCard } from "@/features/matching";
import axiosServer from "@/utils/axios";
import RematchingTicketStatus from "../components/RematchingTicketStatus";

interface MatchResult {
  id: string;
  user1_id: string;
  user2_id: string;
  instagram_id: string | null;
  score: number;
  isRematch?: boolean;
  partner_name?: string;
  title: string;
  description: string;
}

// 매칭 파트너 인터페이스 추가
interface MatchingPartner {
  id: string;
  name: string;
  age: number;
  gender: string;
  university: {
    department: string;
    name: string;
    grade: string;
    studentNumber: string;
  };
  preferences: {
    typeName: string;
    selectedOptions: {
      id: string;
      displayName: string;
    }[];
  }[];
}

interface MatchingResponse {
  partner: MatchingPartner;
}

// 프로필 필드 타입 정의
type ProfileField = keyof Profile;

// 프로필 모달 컴포넌트 추가
function PartnerProfileModal({
  open,
  onClose,
  profile,
}: {
  open: boolean;
  onClose: () => void;
  profile: any;
}) {
  if (!profile) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        <h3 className="text-xl font-bold mb-4">매칭 상대 프로필</h3>

        {/* 기본 정보 */}
        <div className="bg-purple-50 rounded-lg p-4 mb-4">
          <h4 className="font-semibold mb-2 text-purple-700">기본 정보</h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-sm font-medium text-gray-500">나이:</span>
              <span className="ml-2">{profile.age}세</span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">MBTI:</span>
              <span className="ml-2">{profile.mbti}</span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">키:</span>
              <span className="ml-2">{profile.height}cm</span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">학과:</span>
              <span className="ml-2">{profile.department}</span>
            </div>
          </div>
        </div>

        {/* 성격 */}
        <div className="bg-blue-50 rounded-lg p-4 mb-4">
          <h4 className="font-semibold mb-2 text-blue-700">성격</h4>
          <div className="flex flex-wrap gap-2">
            {profile.personalities?.map(
              (personality: string, index: number) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                >
                  {personality}
                </span>
              )
            )}
          </div>
        </div>

        {/* 데이트 스타일 */}
        <div className="bg-pink-50 rounded-lg p-4 mb-4">
          <h4 className="font-semibold mb-2 text-pink-700">데이트 스타일</h4>
          <div className="flex flex-wrap gap-2">
            {profile.dating_styles?.map((style: string, index: number) => (
              <span
                key={index}
                className="px-2 py-1 bg-pink-100 text-pink-700 rounded-full text-sm"
              >
                {style}
              </span>
            ))}
          </div>
        </div>

        {/* 생활 습관 */}
        <div className="bg-green-50 rounded-lg p-4">
          <h4 className="font-semibold mb-2 text-green-700">생활 습관</h4>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <span className="text-sm font-medium text-gray-500">흡연:</span>
              <span className="ml-2">
                {profile.smoking === "비흡연"
                  ? "비흡연"
                  : profile.smoking === "가끔 흡연"
                    ? "가끔 흡연"
                    : profile.smoking === "흡연"
                      ? "흡연"
                      : "미입력"}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">음주:</span>
              <span className="ml-2">
                {profile.drinking === "안 마심"
                  ? "안 마심"
                  : profile.drinking === "가끔 마심"
                    ? "가끔 마심"
                    : profile.drinking === "자주 마심"
                      ? "자주 마심"
                      : "미입력"}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">타투:</span>
              <span className="ml-2">
                {profile.tattoo === "없음"
                  ? "없음"
                  : profile.tattoo === "있음"
                    ? "있음"
                    : profile.tattoo === "비공개"
                      ? "비공개"
                      : "미입력"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { open, close } = useModal();

  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAdditionalInfoModal, setShowAdditionalInfoModal] = useState(false);
  const [hasUserPreferences, setHasUserPreferences] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const { redirect } = useRouteMemory();

  // 리매칭 관련 상태
  const [showRematchModal, setShowRematchModal] = useState(false);
  const [showRematchWarningModal, setShowRematchWarningModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const accountNumberRef = useRef<HTMLParagraphElement>(null);
  const [isMatchingTimeOver, setIsMatchingTimeOver] = useState(false);
  const [hasRequestedRematch, setHasRequestedRematch] = useState(false);

  // 매칭 상태 추가
  const [matchingPartner, setMatchingPartner] = useState<MatchingPartner | null>(null);
  const [matchingError, setMatchingError] = useState<string | null>(null);

  // 프로필 정보 조회
  const fetchProfileData = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        console.error("토큰이 없습니다.");
        router.push("/");
        return;
      }

      const response = await axiosServer.get("/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        router.push("/");
        console.error("프로필 정보 조회 실패");
        return;
      }

      const data = await response.data;
      setProfileData(data);
    } catch (error) {
      console.error("프로필 정보 조회 중 오류:", error);
    }
  };

  // 매칭 상태 조회 함수
  const fetchMatchingStatus = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        console.error("토큰이 없습니다.");
        return;
      }

      const response = await axiosServer.get("/matching", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("매칭 응답:", response.data); // 디버깅용 로그

      if (response.data) {
        // API가 직접 파트너 정보를 반환하므로 response.data를 그대로 사용
        setMatchingPartner(response.data);
        setMatchingError(null);
        setIsMatchingTimeOver(true);
      } else {
        setMatchingPartner(null);
        setMatchingError("매칭된 상대가 없습니다.");
      }
    } catch (error) {
      console.error("매칭 상태 조회 중 오류:", error);
      setMatchingError("매칭 정보를 불러오는데 실패했습니다.");
      setMatchingPartner(null);
    }
  };

  // 초기화 함수
  const initializeHome = async () => {
    if (!user) return;

    try {
      await fetchProfileData();
      await fetchMatchingStatus();
    } catch (error) {
      console.error("초기화 중 오류:", error);
    }
  };

  useEffect(() => {
    initializeHome();
  }, [user]);

  // 매칭 시간이 되면 결과 조회
  useEffect(() => {
    if (isMatchingTimeOver) {
      fetchMatchingStatus();
    }
  }, [isMatchingTimeOver]);

  const handlePaymentClick = async () => {
    redirect('payment/purchase', {
      identifier: PaymentProduct.REMATCH,
    });
  };

  // 매칭 상태 섹션 컴포넌트
  const MatchingStatusSection = () => {
    if (!isMatchingTimeOver) {
      return (
        <section className="card space-y-6 transform transition-all hover:scale-[1.02] bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#74B9FF]/10 flex items-center justify-center transform transition-all duration-200 hover:rotate-12">
                <svg
                  className="w-7 h-7 text-[#74B9FF]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-[#2D3436] tracking-tight">
                매칭 상태
              </h2>
            </div>
            <div className="bg-[#74B9FF]/5 rounded-xl p-4">
              <p className="text-[#636E72] leading-relaxed text-lg">
                매칭 카운트 다운이 지나면 공개됩니다.
              </p>
            </div>
          </div>
        </section>
      );
    }

    if (!matchingPartner) {
      return (
        <section className="card space-y-6 transform transition-all hover:scale-[1.02] bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#74B9FF]/10 flex items-center justify-center transform transition-all duration-200 hover:rotate-12">
                <svg
                  className="w-7 h-7 text-[#74B9FF]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-[#2D3436] tracking-tight">
                매칭 상태
              </h2>
            </div>
            <div className="bg-[#74B9FF]/5 rounded-xl p-4">
              <p className="text-[#636E72] leading-relaxed text-lg">
                {matchingError || "매칭된 상대가 없습니다."}
              </p>
            </div>
          </div>
        </section>
      );
    }

    return (
      <section className="card space-y-6 transform transition-all hover:scale-[1.02] bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#6C5CE7]/10 flex items-center justify-center transform transition-all duration-200 hover:rotate-12">
              <svg
                className="w-7 h-7 text-[#6C5CE7]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#2D3436] tracking-tight">
                매칭 완료!
              </h2>
              <span className="text-sm text-[#0984E3] font-medium">
                매칭된 상대방 정보
              </span>
            </div>
          </div>

          <div className="bg-[#6C5CE7]/5 rounded-xl p-6 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-[#2D3436]">
                  {matchingPartner.name}
                </h3>
                <span className="text-[#6C5CE7] font-medium">
                  {matchingPartner.age}세
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">학교/학과</p>
                  <p className="font-medium">
                    {matchingPartner.university?.name || '미입력'} {matchingPartner.university?.department || ''}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">학년</p>
                  <p className="font-medium">{matchingPartner.university?.grade || '미입력'}</p>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-3">선호도 정보</h4>
                <div className="space-y-4">
                  {matchingPartner.preferences?.map((pref, index) => (
                    <div key={index} className="space-y-2">
                      <p className="text-sm text-gray-500">{pref.typeName}</p>
                      <div className="flex flex-wrap gap-2">
                        {pref.selectedOptions.map((option) => (
                          <span
                            key={option.id}
                            className="px-3 py-1 bg-[#6C5CE7]/10 text-[#6C5CE7] rounded-full text-sm"
                          >
                            {option.displayName}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFD] pb-20">
      <>
        {/* 온보딩 모달 */}
        {showOnboardingModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-sm mx-4 space-y-6 shadow-xl transform transition-all">
              <div className="text-center space-y-4">
                <div className="text-5xl">👋</div>
                <h2 className="text-2xl font-bold text-[#2D3436]">
                  환영합니다!
                </h2>
                <p className="text-[#636E72] leading-relaxed">
                  매칭 서비스를 이용하기 위해서는
                  <br />
                  먼저 기본 정보를 입력해주세요.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowOnboardingModal(false);
                  router.replace("/onboarding");
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
                <h2 className="text-2xl font-bold text-[#2D3436]">
                  프로필을 설정해주세요
                </h2>
                <p className="text-[#636E72] leading-relaxed">
                  나를 더 잘 표현할 수 있는
                  <br />
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
                <h2 className="text-2xl font-bold text-[#2D3436]">
                  추가 정보가 필요해요
                </h2>
                <p className="text-[#636E72] leading-relaxed">
                  더 정확한 매칭을 위해
                  <br />몇 가지 정보를 더 입력해주세요.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAdditionalInfoModal(false);
                  router.replace("/profile");
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
                Sometime
              </div>
              <div className="text-[#2D3436] font-medium flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#6C5CE7] text-white flex items-center justify-center font-bold cursor-pointer">
                  {profileData?.name?.[0]?.toUpperCase() || "?"}
                </div>
                <span>{profileData?.name || "게스트"}님</span>
              </div>
            </div>
          </div>
        </header>

        {/* 메인 컨텐츠 */}
        <main className="max-w-lg mx-auto p-6 space-y-6" role="main">
          {/* 프로필 작성 알림 - 프로필 데이터가 없을 때만 표시 */}
          {!profileData && (
            <section className="card space-y-6 transform transition-all hover:scale-[1.02] bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#6C5CE7]/10 flex items-center justify-center transform transition-all duration-200 hover:rotate-12">
                    <svg
                      className="w-7 h-7 text-[#6C5CE7]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-[#2D3436] tracking-tight">
                    프로필을 작성해주세요!
                  </h2>
                </div>
                <p className="text-[#636E72] leading-relaxed text-lg">
                  나를 더 잘 표현할 수 있는 프로필을 작성해주세요. 매칭의
                  정확도를 높일 수 있어요!
                </p>
                <button
                  onClick={() => router.push("/profile")}
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
                  <h2 className="text-2xl font-bold text-[#2D3436]">
                    추가 정보가 필요해요
                  </h2>
                  <p className="text-[#636E72] leading-relaxed">
                    더 정확한 매칭을 위해
                    <br />몇 가지 정보를 더 입력해주세요.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowAdditionalInfoModal(false);
                    router.replace("/profile");
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
                  Sometime
                </div>
                <div className="text-[#2D3436] font-medium flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#6C5CE7] text-white flex items-center justify-center font-bold cursor-pointer">
                    {profileData?.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <span>{profileData?.name || "게스트"}님</span>
                </div>
              </div>
            </div>
          </header>

          {/* 메인 컨텐츠 */}
          <main className="max-w-lg mx-auto p-6 space-y-6" role="main">
            {/* 프로필 작성 알림 - 프로필 데이터가 없을 때만 표시 */}
            {!profileData && (
              <section className="card space-y-6 transform transition-all hover:scale-[1.02] bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#6C5CE7]/10 flex items-center justify-center transform transition-all duration-200 hover:rotate-12">
                      <svg
                        className="w-7 h-7 text-[#6C5CE7]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-[#2D3436] tracking-tight">
                      프로필을 작성해주세요!
                    </h2>
                  </div>
                  <p className="text-[#636E72] leading-relaxed text-lg">
                    나를 더 잘 표현할 수 있는 프로필을 작성해주세요. 매칭의
                    정확도를 높일 수 있어요!
                  </p>
                  <button
                    onClick={() => router.push("/profile")}
                    className="btn-primary w-full py-4 flex items-center justify-center gap-3 bg-[#6C5CE7] text-white rounded-xl font-medium transform transition-all duration-200 hover:bg-[#5849BE] hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7] focus:ring-offset-2"
                    type="button"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </section>
          )}

            {/* 매칭 시작까지 남은 시간 */}
            <section className="card space-y-6 transform transition-all hover:scale-[1.02] bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#0984E3]/10 flex items-center justify-center transform transition-all duration-200 hover:rotate-12">
                    <svg
                      className="w-7 h-7 text-[#0984E3]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-[#2D3436] tracking-tight">
                    매칭 시작까지
                  </h2>
                </div>
                <div className="bg-[#0984E3]/5 rounded-xl p-4">
                  <MatchingCountdown onTimeOver={() => setIsMatchingTimeOver(true)} />
                </div>
                <h2 className="text-2xl font-bold text-[#2D3436] tracking-tight">
                  현재 소개팅 신청자 수
                </h2>
              </div>
              <div className="bg-[#00B894]/5 rounded-xl p-4">
                <ActiveUsersCounter />
              </div>
            </div>
          </section>

            {/* 매칭 상태 섹션 */}
            <MatchingStatusSection />

            {/* 재매칭 티켓 개수 */}
            <RematchingTicketStatus />

            {/* 재매칭 티켓 결제 */}
            <RematchingCard />

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

            {/* 회사 정보 추가 */}
            <footer className="mt-8 mb-20 text-center text-xs text-gray-500 space-y-2">
              <div className="space-x-2">
                <span>상호명: 스마트 뉴비</span>
                <span>|</span>
                <span>대표: 전준영</span>
              </div>
              <div className="space-x-2">
                <span>사업장 소재지: 대전광역시 유성구 동서대로 125, S9동 202호</span>
              </div>
              <div className="space-x-2">
                <span>사업자 등록번호: 498-05-02914</span>
              </div>
              <div className="space-x-2">
                <span>문의전화: 070-8065-4387</span>
                <span>|</span>
                <span>이메일: notify@smartnewb.com</span>
              </div>
            </footer>

            {/* 하단 네비게이션 */}
            <nav
              className="fixed bottom-0 left-0 right-0 bg-white border-t py-3 shadow-lg transition-all duration-200 ease-in-out"
              role="navigation"
              aria-label="메인 네비게이션"
            >
              <div className="max-w-lg mx-auto px-6 flex justify-around items-center">
                <button
                  onClick={() => router.push("/home")}
                  className="flex flex-col items-center text-[#6C5CE7] transform hover:scale-105 transition-all duration-200"
                  type="button"
                  aria-label="홈으로 이동"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                  />
                </svg>
                <span className="text-sm font-medium mt-1">커뮤니티</span>
              </button>
              <button
                onClick={handleGoToSettings}
                className="flex flex-col items-center text-[#636E72] hover:text-[#6C5CE7] transform hover:scale-105 transition-all duration-200"
                type="button"
                aria-label="설정으로로 이동"
              >
                <svg
                  className="w-7 h-7"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <svg
                    className="w-7 h-7"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                    />
                  </svg>
                  <span className="text-sm font-medium mt-1">커뮤니티</span>
                </button>
                <button
                  onClick={() => router.push("/settings")}
                  className="flex flex-col items-center text-[#636E72] hover:text-[#6C5CE7] transform hover:scale-105 transition-all duration-200"
                  type="button"
                  aria-label="설정으로로 이동"
                >
                  <svg
                    className="w-7 h-7"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
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
                <p className="mb-3">
                  리매칭을 신청하시면 새로운 매칭을 받으실 수 있습니다.
                </p>
                <div className="bg-yellow-50 p-4 rounded-md mb-4">
                  <p className="font-medium text-yellow-700 mb-2">
                    참가비: 2,000원
                  </p>
                  <div className="flex items-center">
                    <p className="text-sm text-gray-700 mr-2">
                      계좌번호: 카카오뱅크 3333225272696 전준영
                    </p>
                    <button
                      onClick={copyAccountNumber}
                      className="text-xs bg-gray-200 hover:bg-gray-300 py-1 px-2 rounded"
                    >
                      {isCopied ? "복사됨" : "복사"}
                    </button>
                  </div>
                  <p className="text-sm text-gray-700 mt-2"></p>
                  <p
                    ref={accountNumberRef}
                    className="absolute opacity-0 pointer-events-none"
                  ></p>
                </div>
                <p className="text-sm text-gray-600">
                  * 입금 후 리매칭 신청이 완료됩니다. 매칭 시간에 새로운 매칭
                  결과를 확인해주세요.
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

                <h3 className="text-xl font-bold mb-4">리매칭 신청</h3>

                <div className="mb-6">
                  <p className="mb-3">매칭 결과에 만족하지 않으신가요?</p>
                  <p className="mb-3">
                    리매칭을 신청하시면 새로운 매칭을 받으실 수 있습니다.
                  </p>
                  <div className="bg-yellow-50 p-4 rounded-md mb-4">
                    <p className="font-medium text-yellow-700 mb-2">
                      참가비: 2,000원
                    </p>
                    <div className="flex items-center">
                      <p className="text-sm text-gray-700 mr-2">
                        계좌번호: 카카오뱅크 3333225272696 전준영
                      </p>
                      <button
                        onClick={() => {
                          setShowRematchModal(false);
                        }}
                        className="text-xs bg-gray-200 hover:bg-gray-300 py-1 px-2 rounded"
                      >
                        {isCopied ? "복사됨" : "복사"}
                      </button>
                    </div>
                    <p className="text-sm text-gray-700 mt-2"></p>
                    <p
                      ref={accountNumberRef}
                      className="absolute opacity-0 pointer-events-none"
                    ></p>
                  </div>
                  <p className="text-sm text-gray-600">
                    * 입금 후 리매칭 신청이 완료됩니다. 매칭 시간에 새로운 매칭
                    결과를 확인해주세요.
                  </p>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowRematchModal(false);
                      fetchMatchingStatus();
                    }}
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
                <h3 className="text-xl font-bold mb-2">
                  프로필 정보를 완성해주세요
                </h3>
                <p className="text-gray-600">
                  매칭에 필요한 정보가 부족합니다. 프로필, 이상형 정보, 기본
                  정보를 완성하고 재매칭 신청을 진행해주세요. 계속 오류가
                  발생하면 재 로그인 부탁드립니다.
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowRematchWarningModal(false);
                    router.push("/onboarding");
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

        {/* 프로필 모달 추가 */}
        {showRematchModal && (
          <PartnerProfileModal
            open={showRematchModal}
            onClose={() => setShowRematchModal(false)}
            profile={profileData}
          />
        )}
      </>
    </div>
  );
}
