"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { CountryProvider } from "@/contexts/CountryContext";
import CountryFAB from "./components/CountryFAB";
import CountrySelectorModal from "./components/CountrySelectorModal";

export default function AdminLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [countryModalOpen, setCountryModalOpen] = useState(false);
  const router = useRouter();
  const { user, isAdmin, signOut } = useAuth();

  useEffect(() => {
    let mounted = true;

    async function checkAccess() {
      try {
        if (!mounted) return;

        console.log("관리자 권한 확인 시작");

        // 로딩 중이 아닐 때만 상태 체크
        if (!loading) {
          // 인증되지 않은 경우
          if (!user) {
            console.warn("인증된 세션이 없음 - 관리자 페이지 접근 거부");
            router.replace("/");
            return;
          }

          console.log("로그인 사용자:", user.email);
          console.log("관리자 여부:", isAdmin);

          // 관리자가 아닌 경우
          if (!isAdmin) {
            console.warn("관리자가 아닌 사용자의 접근 시도:", user.email);
            router.replace("/");
            return;
          }

          console.log("관리자 권한 확인됨");
        }
      } catch (error) {
        console.error("관리자 확인 중 오류:", error);
        if (mounted) {
          router.replace("/");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    checkAccess();

    return () => {
      mounted = false;
    };
  }, [router, user, isAdmin, loading]);

  const handleLogout = async () => {
    try {
      console.log("로그아웃 시도");
      await signOut();
    } catch (error) {
      console.error("로그아웃 처리 중 예외 발생:", error);
    }
  };

  // 로딩 중일 때의 UI
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-DEFAULT border-t-transparent border-solid rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">관리자 권한 확인 중...</p>
        </div>
      </div>
    );
  }

  // 관리자가 아닐 때의 UI
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center bg-white p-8 rounded-lg shadow-md">
          <p className="text-red-600 font-bold text-xl mb-4">
            관리자 권한이 필요합니다
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2 bg-primary-DEFAULT text-white rounded-md hover:bg-primary-dark transition-colors"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 관리자 UI
  return (
    <CountryProvider>
      <div className="flex h-screen bg-gray-100">
        {/* 사이드바 */}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-md transform ${sidebarOpen ? "translate-x-0 " : "-translate-x-full"} transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:inset-0 overflow-y-auto`}
        >
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold text-primary-DEFAULT">
              관리자 대시보드
            </h2>
            <p className="text-sm text-gray-500 mt-1">{user?.email}</p>
          </div>
          <nav className="mt-2 pb-4">
            {/* 📊 대시보드 */}
            <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              📊 대시보드
            </div>
            <ul>
              <li>
                <Link
                  href="/admin/dashboard"
                  className="block px-4 py-2 text-gray-600 hover:bg-primary-DEFAULT hover:text-white transition-colors"
                  onClick={() => setSidebarOpen(false)}
                >
                  메인 대시보드
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/dashboard/member-stats"
                  className="block px-4 py-2 text-gray-600 hover:bg-primary-DEFAULT hover:text-white transition-colors"
                  onClick={() => setSidebarOpen(false)}
                >
                  회원 통계
                </Link>
              </li>
            </ul>

            {/* 👥 회원 관리 */}
            <div className="px-4 py-2 mt-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              👥 회원 관리
            </div>
            <ul>
              <li>
                <Link
                  href="/admin/users/appearance"
                  className="block px-4 py-2 text-gray-600 hover:bg-primary-DEFAULT hover:text-white transition-colors"
                  onClick={() => setSidebarOpen(false)}
                >
                  사용자 관리
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/profile-review"
                  className="block px-4 py-2 text-gray-600 hover:bg-primary-DEFAULT hover:text-white transition-colors"
                  onClick={() => setSidebarOpen(false)}
                >
                  회원 적격 심사
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/reports"
                  className="block px-4 py-2 text-gray-600 hover:bg-primary-DEFAULT hover:text-white transition-colors"
                  onClick={() => setSidebarOpen(false)}
                >
                  프로필 신고 관리
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/community"
                  className="block px-4 py-2 text-gray-600 hover:bg-primary-DEFAULT hover:text-white transition-colors"
                  onClick={() => setSidebarOpen(false)}
                >
                  커뮤니티 관리
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/support-chat"
                  className="block px-4 py-2 text-gray-600 hover:bg-primary-DEFAULT hover:text-white transition-colors"
                  onClick={() => setSidebarOpen(false)}
                >
                  Q&A 처리
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/universities"
                  className="block px-4 py-2 text-gray-600 hover:bg-primary-DEFAULT hover:text-white transition-colors"
                  onClick={() => setSidebarOpen(false)}
                >
                  대학 관리
                </Link>
              </li>
            </ul>

            {/* 💕 매칭/채팅 */}
            <div className="px-4 py-2 mt-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              💕 매칭/채팅
            </div>
            <ul>
              <li>
                <Link
                  href="/admin/matching-management"
                  className="block px-4 py-2 text-gray-600 hover:bg-primary-DEFAULT hover:text-white transition-colors"
                  onClick={() => setSidebarOpen(false)}
                >
                  매칭 관리
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/scheduled-matching"
                  className="block px-4 py-2 text-gray-600 hover:bg-primary-DEFAULT hover:text-white transition-colors"
                  onClick={() => setSidebarOpen(false)}
                >
                  스케줄 관리
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/chat"
                  className="block px-4 py-2 text-gray-600 hover:bg-primary-DEFAULT hover:text-white transition-colors"
                  onClick={() => setSidebarOpen(false)}
                >
                  채팅 관리
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/ai-chat"
                  className="block px-4 py-2 text-gray-600 hover:bg-primary-DEFAULT hover:text-white transition-colors"
                  onClick={() => setSidebarOpen(false)}
                >
                  AI 채팅 관리
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/moment"
                  className="block px-4 py-2 text-gray-600 hover:bg-primary-DEFAULT hover:text-white transition-colors"
                  onClick={() => setSidebarOpen(false)}
                >
                  모먼트 관리
                </Link>
              </li>
            </ul>

            {/* 💰 결제/매출 */}
            <div className="px-4 py-2 mt-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              💰 결제/매출
            </div>
            <ul>
              <li>
                <Link
                  href="/admin/sales"
                  className="block px-4 py-2 text-gray-600 hover:bg-primary-DEFAULT hover:text-white transition-colors"
                  onClick={() => setSidebarOpen(false)}
                >
                  매출 조회
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/gems"
                  className="block px-4 py-2 text-gray-600 hover:bg-primary-DEFAULT hover:text-white transition-colors"
                  onClick={() => setSidebarOpen(false)}
                >
                  구슬 관리
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/ios-refund"
                  className="block px-4 py-2 text-gray-600 hover:bg-primary-DEFAULT hover:text-white transition-colors"
                  onClick={() => setSidebarOpen(false)}
                >
                  iOS 환불 관리
                </Link>
              </li>
            </ul>

            {/* 📢 마케팅 */}
            <div className="px-4 py-2 mt-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              📢 마케팅
            </div>
            <ul>
              <li>
                <Link
                  href="/admin/sms"
                  className="block px-4 py-2 text-gray-600 hover:bg-primary-DEFAULT hover:text-white transition-colors"
                  onClick={() => setSidebarOpen(false)}
                >
                  SMS 관리
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/push-notifications"
                  className="block px-4 py-2 text-gray-600 hover:bg-primary-DEFAULT hover:text-white transition-colors"
                  onClick={() => setSidebarOpen(false)}
                >
                  푸시 알림 관리
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/card-news"
                  className="block px-4 py-2 text-gray-600 hover:bg-primary-DEFAULT hover:text-white transition-colors"
                  onClick={() => setSidebarOpen(false)}
                >
                  카드뉴스 관리
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/banners"
                  className="block px-4 py-2 text-gray-600 hover:bg-primary-DEFAULT hover:text-white transition-colors"
                  onClick={() => setSidebarOpen(false)}
                >
                  배너 관리
                </Link>
              </li>
            </ul>

            {/* 🔄 리텐션 */}
            <div className="px-4 py-2 mt-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              🔄 리텐션
            </div>
            <ul>
              <li>
                <Link
                  href="/admin/female-retention"
                  className="block px-4 py-2 text-gray-600 hover:bg-primary-DEFAULT hover:text-white transition-colors"
                  onClick={() => setSidebarOpen(false)}
                >
                  여성 유저 리텐션
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/deleted-females"
                  className="block px-4 py-2 text-gray-600 hover:bg-primary-DEFAULT hover:text-white transition-colors"
                  onClick={() => setSidebarOpen(false)}
                >
                  탈퇴 회원 복구
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/dormant-likes"
                  className="block px-4 py-2 text-gray-600 hover:bg-primary-DEFAULT hover:text-white transition-colors"
                  onClick={() => setSidebarOpen(false)}
                >
                  파묘 좋아요
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/dormant-likes/logs"
                  className="block px-4 py-2 text-gray-600 hover:bg-primary-DEFAULT hover:text-white transition-colors"
                  onClick={() => setSidebarOpen(false)}
                >
                  처리 이력
                </Link>
              </li>
            </ul>

            {/* ⚙️ 설정 */}
            <div className="px-4 py-2 mt-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              ⚙️ 설정
            </div>
            <ul>
              <li>
                <Link
                  href="/admin/version-management"
                  className="block px-4 py-2 text-gray-600 hover:bg-primary-DEFAULT hover:text-white transition-colors"
                  onClick={() => setSidebarOpen(false)}
                >
                  버전 관리
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/lab"
                  className="block px-4 py-2 text-gray-600 hover:bg-primary-DEFAULT hover:text-white transition-colors"
                  onClick={() => setSidebarOpen(false)}
                >
                  실험실
                </Link>
              </li>
            </ul>

            {/* 로그아웃 */}
            <div className="px-4 pt-4 mt-3 border-t">
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-red-500 hover:bg-red-50 rounded transition-colors"
              >
                로그아웃
              </button>
            </div>
          </nav>
        </div>

        {/* 모바일 오버레이 */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* 메인 콘텐츠 */}
        <div className="flex-1 flex flex-col overflow-auto">
          {/* 모바일 전용 햄버거 버튼 */}
          <div className="md:hidden flex items-center justify-between p-4 bg-white shadow-sm">
            <h1 className="text-lg font-semibold">관리자 대시보드</h1>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-md hover:bg-gray-100"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
          <main className="p-6">{children}</main>
        </div>

        {/* 국가 선택 FAB */}
        <CountryFAB onClick={() => setCountryModalOpen(true)} />
        <CountrySelectorModal
          open={countryModalOpen}
          onClose={() => setCountryModalOpen(false)}
        />
      </div>
    </CountryProvider>
  );
}
