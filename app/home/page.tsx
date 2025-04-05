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
import { createClient } from "@/utils/supabase/client";
import { ADMIN_EMAIL } from "@/utils/config";
import type { Profile } from "@/contexts/AuthContext";
import type { Database } from "../types/database.types";

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
  const supabase = createClient();
  const router = useRouter();
  const { user, profile } = useAuth();

  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdditionalInfoModal, setShowAdditionalInfoModal] = useState(false);
  const [hasUserPreferences, setHasUserPreferences] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);

  // 리매칭 관련 상태
  const [showRematchModal, setShowRematchModal] = useState(false);
  const [showRematchWarningModal, setShowRematchWarningModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const accountNumberRef = useRef<HTMLParagraphElement>(null);
  const [isMatchingTimeOver, setIsMatchingTimeOver] = useState(false);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [isMultipleMatches, setIsMultipleMatches] = useState(false);
  const [hasRequestedRematch, setHasRequestedRematch] = useState(false);

  // 추가된 상태
  const [showPartnerProfile, setShowPartnerProfile] = useState(false);
  const [partnerProfile, setPartnerProfile] = useState<any>(null);

  // 새로운 상태 추가
  const [showProfileWarningModal, setShowProfileWarningModal] = useState(false);

  // 프로필 정보 조회
  const fetchProfileData = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        console.error("토큰이 없습니다.");
        router.push("/");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/profile`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/");
          return;
        }
        throw new Error("프로필 정보 조회 실패");
      }

      const data = await response.json();
      setProfileData(data);
    } catch (error) {
      console.error("프로필 정보 조회 중 오류:", error);
    }
  };

  // 사용자 선호도 정보 조회
  const checkUserPreferences = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) {
        console.error("선호도 정보 조회 오류:", error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error("선호도 정보 확인 중 오류:", error);
      return false;
    }
  };

  // 페이지 이동 함수들
  const handleGoToProfile = () => router.push("/profile");
  const handleGoToHome = () => router.push("/home");
  const handleGoToSettings = () => router.push("/settings");

  // 계좌번호 복사 기능
  const copyAccountNumber = () => {
    navigator.clipboard
      .writeText("카카오뱅크 3333-12-3456789")
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch((err) => {
        console.error("계좌번호 복사 실패:", err);
      });
  };

  // 리매칭 신청 처리 함수
  const handleRematchRequest = () => {
    if (!profile) return;

    const requiredFields = [
      "height",
      "personalities",
      "dating_styles",
    ] as const;
    const hasRequiredFields = requiredFields.every((field) => {
      const value = profile[field];
      return (
        value && (Array.isArray(value) ? value.length > 0 : Boolean(value))
      );
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

      // matching_requests 테이블에 레코드 추가
      const { data, error } = await supabase.from("matching_requests").insert([
        {
          user_id: user?.id,
          status: "pending",
          preferred_date: new Date().toISOString().split("T")[0],
          preferred_time: "19:00",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        console.error("리매칭 요청 DB 저장 오류:", error);
        throw new Error("리매칭 요청 처리 중 오류가 발생했습니다.");
      }

      // 로컬 스토리지에 재매칭 신청 상태 저장
      localStorage.setItem("rematchRequested", "true");
      setHasRequestedRematch(true);

      setNotificationMessage(
        "리매칭 신청이 완료되었습니다. 다음 매칭을 기대해주세요!"
      );
      setShowNotificationModal(true);
    } catch (error) {
      console.error("리매칭 요청 오류:", error);
      setNotificationMessage("리매칭 요청 중 오류가 발생했습니다.");
      setShowNotificationModal(true);
    }
  };

  // 매칭 시간 상태 업데이트 핸들러
  const handleMatchingTimeUpdate = (isOver: boolean) => {
    setIsMatchingTimeOver(true); // 항상 true로 설정
  };

  // 매칭 결과 조회 함수
  const fetchMatchResult = async () => {
    if (!user) return;

    try {
      // 1. matches 테이블에서 매칭 정보 조회
      const { data: matchData, error: matchError } = await supabase
        .from("matches")
        .select("id, user1_id, user2_id, score, created_at")
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      // 2. rematches 테이블에서 재매칭 정보 조회
      const { data: rematchData, error: rematchError } = await supabase
        .from("rematches")
        .select("id, user1_id, user2_id, score, created_at")
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if ((matchError && rematchError) || (!matchData && !rematchData)) {
        console.error("매칭 결과 조회 실패:", { matchError, rematchError });
        return;
      }

      // 모든 매칭 데이터 합치기
      const allMatches = [...(matchData || []), ...(rematchData || [])].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setIsMultipleMatches(allMatches.length > 1);

      // 모든 매칭 정보를 처리
      const matchResultsPromises = allMatches.map(async (match, index) => {
        const partnerId =
          match.user1_id === user.id ? match.user2_id : match.user1_id;

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("instagram_id, name")
          .eq("user_id", partnerId)
          .single();

        if (profileError) {
          console.error("프로필 조회 실패:", profileError);
          return null;
        }

        // 매칭 타입 구분 (matches vs rematches)
        const isFromRematches = rematchData?.some(
          (rematch) => rematch.id === match.id
        );

        return {
          id: match.id,
          user1_id: match.user1_id,
          user2_id: match.user2_id,
          instagram_id: profileData.instagram_id,
          score: match.score + 40,
          isRematch: isFromRematches,
          partner_name: profileData.name,
          created_at: match.created_at,
          title: isFromRematches ? "재매칭 결과" : "매칭 결과",
          description: isFromRematches
            ? "재매칭으로 새로 매칭된 상대입니다"
            : "첫 매칭 상대입니다",
        };
      });

      // 모든 매칭 결과 가져오기
      const results = await Promise.all(matchResultsPromises);
      const validResults = results.filter(
        (result) => result !== null
      ) as MatchResult[];

      setMatchResults(validResults);
    } catch (error) {
      console.error("매칭 결과 조회 중 오류:", error);
    }
  };

  // 인스타 ID 복사 함수
  const copyInstagramId = async (instagramId: string) => {
    try {
      await navigator.clipboard.writeText(instagramId);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("복사 실패:", err);
    }
  };

  // 재매칭 신청 여부 확인 함수 추가
  const checkRematchRequest = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("matching_requests")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error) {
      console.error("재매칭 신청 조회 오류:", error);
      return;
    }

    setHasRequestedRematch(!!data);
  };

  // 프로필 조회 함수
  const fetchPartnerProfile = async (match: MatchResult) => {
    if (!user) return null;

    try {
      // 현재 사용자가 user1인지 user2인지 확인하여 상대방 ID 결정
      const partnerId =
        match.user1_id === user.id ? match.user2_id : match.user1_id;

      // 프로필 정보 조회
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", partnerId)
        .maybeSingle(); // single() 대신 maybeSingle() 사용

      if (profileError) throw profileError;
      if (!profileData) return null;

      // 재매칭인 경우 rematches 테이블도 확인
      if (match.isRematch) {
        const { data: rematchData, error: rematchError } = await supabase
          .from("rematches")
          .select("*")
          .or(`user1_id.eq.${partnerId},user2_id.eq.${partnerId}`)
          .maybeSingle(); // single() 대신 maybeSingle() 사용

        if (!rematchError && rematchData) {
          // rematchData가 있는 경우에만 합치기
          return { ...profileData, rematchData };
        }
      }

      return profileData;
    } catch (error) {
      console.error("프로필 조회 오류:", error);
      return null;
    }
  };

  // 프로필 정보 체크 함수 수정
  const checkProfileCompletion = () => {
    if (!profile) return false;

    const requiredFields = [
      "university",
      "department",
      "student_id",
      "grade",
      "height",
      "mbti",
      "personalities",
      "dating_styles",
      "drinking",
      "smoking",
      "tattoo",
      "instagram_id",
    ];

    const missingFields = requiredFields.filter((field) => {
      if (Array.isArray(profile[field])) {
        return profile[field].length === 0;
      }
      return !profile[field];
    });

    if (missingFields.length > 0) {
      console.log("=== 미입력 프로필 정보 ===");
      console.log("현재 프로필:", profile);
      console.log("미입력 필드:", missingFields);
      missingFields.forEach((field) => {
        console.log(`${field}: ${profile[field]}`);
      });
      console.log("========================");

      setShowProfileWarningModal(true);
      return false;
    }

    return true;
  };

  // 초기화 함수
  const initializeHome = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // 1. 프로필 데이터와 매칭 결과를 동시에 가져오기
      const [profileData, matchData] = await Promise.all([
        fetchProfileData(),
        fetchMatchResult(),
      ]);

      // 2. localStorage 체크
      const hasRequested = localStorage.getItem("rematchRequested") === "true";
      setHasRequestedRematch(hasRequested);

      // 3. 프로필 완성도 체크
      if (profile) {
        const isComplete = checkProfileCompletion();
        if (!isComplete) {
          setShowProfileWarningModal(true);
        }
      }

      // 4. 매칭 시간 설정
      setIsMatchingTimeOver(true);
    } catch (error) {
      console.error("초기화 중 오류:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 단일 useEffect로 모든 초기화 로직 처리
  useEffect(() => {
    initializeHome();
  }, [user]); // user가 변경될 때만 실행

  // 매칭 시간이 되면 결과 조회
  useEffect(() => {
    if (isMatchingTimeOver) {
      fetchMatchResult();
      checkRematchRequest();
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
                  Project-Solo
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
                    onClick={handleGoToProfile}
                    className="btn-primary w-full py-4 flex items-center justify-center gap-3 bg-[#6C5CE7] text-white rounded-xl font-medium transform transition-all duration-200 hover:bg-[#5849BE] hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7] focus:ring-offset-2"
                    type="button"
                  >
                    <span className="text-lg">프로필 작성하기</span>
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
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

            {/* 현재 참여자 수 */}
            <section className="card space-y-6 transform transition-all hover:scale-[1.02] bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#00B894]/10 flex items-center justify-center transform transition-all duration-200 hover:rotate-12">
                    <svg
                      className="w-7 h-7 text-[#00B894]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
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
                  <MatchingCountdown onTimeOver={handleMatchingTimeUpdate} />
                </div>
              </div>
            </section>

            {/* 매칭 결과 섹션 - 여러 개의 매칭 카드 표시 */}
            {isMatchingTimeOver && matchResults.length > 0 && (
              <>
                {matchResults.map((match, index) => (
                  <section
                    key={match.id}
                    className={`card space-y-6 transform transition-all hover:scale-[1.02] bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl ${
                      match.isRematch ? "border-2 border-[#0984E3]" : ""
                    }`}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-2xl ${
                            match.isRematch
                              ? "bg-[#0984E3]/10"
                              : "bg-[#74B9FF]/10"
                          } flex items-center justify-center transform transition-all duration-200 hover:rotate-12`}
                        >
                          <svg
                            className={`w-7 h-7 ${
                              match.isRematch
                                ? "text-[#0984E3]"
                                : "text-[#74B9FF]"
                            }`}
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
                            {match.title}
                          </h2>
                          <span className="text-sm text-[#0984E3] font-medium">
                            {match.description}
                          </span>
                        </div>
                      </div>

                      <div className="bg-[#74B9FF]/5 rounded-xl p-4">
                        <div className="space-y-2">
                          <p className="text-[#636E72] leading-relaxed text-lg">
                            {match.isRematch
                              ? "재매칭이 완료되었습니다! 🎉"
                              : "매칭이 완료되었습니다! 🎉"}
                          </p>
                          {match.partner_name && (
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-gray-800">
                                {match.partner_name}님과 매칭되었습니다
                              </p>
                              <button
                                onClick={async () => {
                                  const profile = await fetchPartnerProfile(
                                    match
                                  );
                                  if (profile) {
                                    setPartnerProfile(profile);
                                    setShowPartnerProfile(true);
                                  }
                                }}
                                className="text-blue-600 hover:text-blue-800 font-medium"
                              >
                                프로필 보기
                              </button>
                            </div>
                          )}
                          <button
                            onClick={() =>
                              match.instagram_id &&
                              copyInstagramId(match.instagram_id)
                            }
                            className="text-blue-500 hover:text-blue-700 underline focus:outline-none"
                          >
                            {isCopied
                              ? "복사됨!"
                              : `Instagram ID: ${
                                  match.instagram_id || "미설정"
                                }`}
                          </button>
                          <p className="text-sm text-gray-500">
                            매칭 점수: {match.score}점
                          </p>
                        </div>
                      </div>

                      {/* 재매칭 버튼 상태 처리 */}
                      {hasRequestedRematch ? (
                        <div className="text-center py-3 bg-gray-100 rounded-xl">
                          <p className="text-gray-600">
                            이미 재매칭이 신청되었습니다, 참가비: 2000원,
                            계좌번호: 카카오뱅크 3333225272696 전준영
                          </p>
                        </div>
                      ) : (
                        !matchResults.some((m) => m.isRematch) && (
                          <button
                            onClick={handleRematchRequest}
                            className="btn-secondary w-full py-4 flex items-center justify-center gap-3 bg-[#74B9FF] text-white rounded-xl font-medium transform transition-all duration-200 hover:bg-[#5FA8FF] hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#74B9FF] focus:ring-offset-2"
                            type="button"
                          >
                            <span className="text-lg">재매칭 신청하기</span>
                            <svg
                              className="w-6 h-6"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                              />
                            </svg>
                          </button>
                        )
                      )}
                    </div>
                  </section>
                ))}
              </>
            )}

            {/* 매칭 결과가 없거나 시간이 안 된 경우 표시할 섹션 */}
            {(!isMatchingTimeOver || matchResults.length === 0) && (
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
                      {isMatchingTimeOver
                        ? "매칭된 상대가 없습니다."
                        : "매칭 카운트 다운이 지나면 공개됩니다."}
                    </p>
                  </div>
                  {isMatchingTimeOver &&
                    !matchResults.some((m) => m.isRematch) &&
                    (hasRequestedRematch ? (
                      <div className="text-center py-3 bg-gray-100 rounded-xl">
                        <p className="text-gray-600">
                          이미 재매칭이 신청되었습니다
                        </p>
                      </div>
                    ) : (
                      <button
                        onClick={handleRematchRequest}
                        className="btn-secondary w-full py-4 flex items-center justify-center gap-3 bg-[#74B9FF] text-white rounded-xl font-medium transform transition-all duration-200 hover:bg-[#5FA8FF] hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#74B9FF] focus:ring-offset-2"
                        type="button"
                      >
                        <span className="text-lg">재매칭 신청하기</span>
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                      </button>
                    ))}
                </div>
              </section>
            )}

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
                  onClick={() => router.push("/community")}
                  className="flex flex-col items-center text-[#636E72] hover:text-[#6C5CE7] transform hover:scale-105 transition-all duration-200"
                  type="button"
                  aria-label="커뮤니티로 이동"
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

          {/* 프로필 정보 미입력 경고 모달 */}
          {showProfileWarningModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
              <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                <div className="text-center mb-6">
                  <div className="text-5xl mb-4">⚠️</div>
                  <h3 className="text-xl font-bold mb-2">
                    프로필 정보를 입력해주세요
                  </h3>
                  <p className="text-gray-600">
                    매칭 서비스를 이용하기 위해서는 기본 정보, 프로필 정보,
                    이상형 정보가 모두 필요합니다. 지금 바로 입력하고 매칭을
                    시작해보세요!
                  </p>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowProfileWarningModal(false);
                      router.push("/onboarding");
                    }}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all"
                  >
                    프로필 입력하기
                  </button>
                  <button
                    onClick={() => setShowProfileWarningModal(false)}
                    className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all"
                  >
                    나중에 하기
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 프로필 모달 추가 */}
          {showPartnerProfile && (
            <PartnerProfileModal
              open={showPartnerProfile}
              onClose={() => setShowPartnerProfile(false)}
              profile={partnerProfile}
            />
          )}
        </>
      )}
    </div>
  );
}
