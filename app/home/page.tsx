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
}
