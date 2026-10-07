"use client";
import { Label as HeroSelectLabel } from "@heroui/react";

import { Button as HeroActionButton } from "@heroui/react";
import { ListBox, Select, Input, Button, Modal } from "@heroui/react";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminService from "@/app/services/admin";
import { adminGet, getAdminErrorMessage } from "@/shared/lib/http/admin-fetch";
import { useConfirm } from "@/shared/ui/admin/confirm-dialog";
import { useToast } from "@/shared/ui/admin/toast";
import { useCountry } from "@/contexts/CountryContext";
import SanctionNoticePanel from "@/components/admin/appearance/modals/SanctionNoticePanel";
import AccountStatusModal from "@/components/admin/appearance/modals/AccountStatusModal";
import {
  formatDateWithoutTimezoneConversion,
  formatDateTimeWithoutTimezoneConversion,
} from "@/app/utils/formatters";
import { GhostUserExposureSheet } from "@/app/admin/ai-profiles/ghosts/ghost-user-exposure-sheet";
import { BlindAvatarSources } from "./blind-avatar-sources";

type ProfileImage = {
  id: string;
  order: number;
  isMain: boolean;
  url: string;
};

type UniversityDetails = {
  name: string;
  authentication: boolean;
  department: string;
};

type PreferenceOption = {
  id: string;
  displayName: string;
};

type Preference = {
  typeName: string;
  selectedOptions: PreferenceOption[];
};

type UserPreferences = {
  self?: Preference[];
  partner?: Preference[];
};

interface User {
  id: string;
  userId: string;
  email: string;
  rank: string | null; // 외모 등급 S/A/B/C/UNKNOWN (null 은 미분류)
  isSuspended: boolean;
  gender: "MALE" | "FEMALE";
  createdAt: string;
  lastActiveAt?: string | null; // 마지막 접속 시간
  name: string;
  age: number;
  phoneNumber?: string;
  instagramId: string | null;
  profileImages: ProfileImage[];
  universityDetails: UniversityDetails | null;
  preferences?: UserPreferences;
  statusAt?: string | null; // 인스타그램 오류 상태 등
}

type ApiResponse = {
  data: User[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const getGenderText = (gender: string) => {
  if (gender === "MALE") return "남성";
  if (gender === "FEMALE") return "여성";
  return "미지정";
};

function UsersV2Content() {
  const router = useRouter();
  const { country } = useCountry();
  const countryRef = useRef(country);
  countryRef.current = country;
  const [detailTab, setDetailTab] = useState<"info" | "sanction">("info");
  const [sanctionBusy, setSanctionBusy] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();
  // 모달이 열린 동안 목록이 재조회돼도 isSuspended 가 뒤집히지 않도록 스냅샷으로 보관한다.
  const [statusTarget, setStatusTarget] = useState<{
    userId: string;
    name: string;
    isSuspended: boolean;
  } | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [exposureSheetUser, setExposureSheetUser] = useState<{
    userId: string;
    name: string;
  } | null>(null);
  const [filter, setFilter] = useState<string>("all"); // 'all', 'blacklisted' — 백엔드 UserFilter 에 reported/active 가 없어 옵션에서 뺐다
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedGender, setSelectedGender] = useState<
    "all" | "MALE" | "FEMALE"
  >("all");
  const [selectedClass, setSelectedClass] = useState<
    "all" | "S" | "A" | "B" | "C" | "unclassified"
  >("all");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10); // 페이지당 표시 개수 고정
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    setPage(1); // 필터 변경 시 페이지 초기화
    fetchUsers();
  }, [filter, selectedGender, selectedClass, country]);

  useEffect(() => { setSelectedUser(null); setStatusTarget(null); setSanctionBusy(false); }, [country]);

  // 페이지 변경 시 데이터 가져오기
  useEffect(() => {
    if (page > 0) {
      fetchUsers();
    }
  }, [page]);

  // 검색어 입력 시 디바운스 적용 — setPage(1)이 page useEffect를 트리거하여 fetchUsers 실행
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        fetchUsers();
      } else {
        setPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  async function fetchUsers(propagateError = false) {
    const requestCountry = country;
    try {
      setLoading(true);
      setError(null); // 오류 상태 초기화

      const params: Record<string, string> = {
        page: page.toString(),
        limit: pageSize.toString(),
      };
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (selectedGender !== "all") params.gender = selectedGender;
      if (filter !== "all") params.filter = filter;
      if (selectedClass !== "all")
        params.appearanceGrade =
          selectedClass === "unclassified" ? "UNKNOWN" : selectedClass;

      // Nest.js API 호출
      const response = await adminGet<ApiResponse>("/admin/v2/users", params);
      if (countryRef.current !== requestCountry) return;
      const userList = response.data ?? [];
      const pagination = response.meta;

      setUsers(userList);
      setTotalCount(pagination.total);
    } catch (err: any) {
      if (countryRef.current !== requestCountry) return;
      setError(err.message || "사용자 목록을 불러오는 중 오류가 발생했습니다.");
      if (propagateError) throw err;
    } finally {
      if (countryRef.current === requestCountry) setLoading(false);
    }
  }

  const handleUserSelect = async (user: User, tab: "info" | "sanction" = "info") => {
    if (sanctionBusy) return;
    setDetailTab(tab);
    if (user.profileImages) {
      user.profileImages.forEach((img, index) => {});

      // 메인 이미지 찾기
      const mainImage = user.profileImages.find((img) => img.isMain === true);
    }

    setSelectedUser(user);

    // 사용자의 메인 이미지를 기본 선택 이미지로 설정, 없으면 첫 번째 이미지 사용
    if (user.profileImages && user.profileImages.length > 0) {
      // 메인 이미지 찾기
      const mainImage = user.profileImages.find((img) => img.isMain === true);

      // 메인 이미지가 있으면 사용, 없으면 첫 번째 이미지 사용
      const imageToUse = mainImage || user.profileImages[0];
      const imageUrl = imageToUse.url;

      setSelectedImage(imageUrl);

      // 상태 업데이트 후 확인을 위한 setTimeout
      setTimeout(() => {}, 100);
    } else {
      setSelectedImage(null);
    }
  };

  const handleCloseDetails = () => {
    if (sanctionBusy) return;
    setSelectedUser(null);
    setSelectedImage(null);
  };

  // 이미지 클릭 함수는 인라인으로 구현하여 직접 사용

  const handleClassificationChange = async (user: User, key: string) => {
    // 빈 키는 "미분류" 선택이며 서버에서는 UNKNOWN 으로 저장된다.
    const rank = key === "" ? "UNKNOWN" : key;
    if (!["S", "A", "B", "C", "UNKNOWN"].includes(rank)) {
      toast.error(`알 수 없는 등급 값입니다: ${key}`);
      return;
    }
    const label = rank === "UNKNOWN" ? "미분류" : `${rank}급`;
    const ok = await confirm({
      title: "등급 변경",
      message: `${user.name || user.userId} 님의 등급을 ${label}(으)로 변경할까요?`,
      confirmText: "변경",
    });
    if (!ok) return;

    try {
      await AdminService.userAppearance.setUserAppearanceGrade(
        user.userId,
        rank as "S" | "A" | "B" | "C" | "UNKNOWN",
      );
      toast.success(`${user.name || user.userId} 님의 등급을 ${label}(으)로 변경했습니다.`);
      await fetchUsers();
    } catch (err: unknown) {
      toast.error(getAdminErrorMessage(err, "등급 변경 중 오류가 발생했습니다."));
    }
  };

  /* 필터 변경 핸들러 - 이제 서버 측에서 처리됨 */
  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    setPage(1); // 필터 변경 시 페이지 초기화
  };

  const handleGenderChange = (gender: "all" | "MALE" | "FEMALE") => {
    setSelectedGender(gender);
    setPage(1); // 필터 변경 시 페이지 초기화
  };

  const handleClassChange = (
    classType: "all" | "S" | "A" | "B" | "C" | "unclassified",
  ) => {
    setSelectedClass(classType);
    setPage(1); // 필터 변경 시 페이지 초기화
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    // 검색어 변경 시 페이지 초기화는 디바운스된 useEffect에서 처리
  };

  // 페이지 버튼 렌더링
  const renderPagination = () => {
    const totalPages = Math.ceil(totalCount / pageSize);
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    return (
      <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div className="flex-1 flex justify-between sm:hidden">
          <Button
            variant="secondary"
            onClick={() => setPage(page - 1)}
            isDisabled={page === 1}
            className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
              page === 1
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            이전
          </Button>
          <Button
            variant="secondary"
            onClick={() => setPage(page + 1)}
            isDisabled={page === totalPages}
            className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
              page === totalPages
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            다음
          </Button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              <span className="font-medium">{page}</span> 페이지 / 총{" "}
              <span className="font-medium">{totalPages}</span> 페이지
            </p>
          </div>
          <div>
            <nav
              className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
              aria-label="Pagination"
            >
              <Button
                variant="secondary"
                onClick={() => setPage(page - 1)}
                isDisabled={page === 1}
                className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                  page === 1
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                <span className="sr-only">이전</span>
                <svg
                  className="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </Button>
              {pages.map((pageNum) => (
                <Button
                  variant="secondary"
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    page === pageNum
                      ? "z-10 bg-[#f7f7f7] border-[#ff385c] text-[#ff385c]"
                      : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {pageNum}
                </Button>
              ))}
              <Button
                variant="secondary"
                onClick={() => setPage(page + 1)}
                isDisabled={page === totalPages}
                className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                  page === totalPages
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                <span className="sr-only">다음</span>
                <svg
                  className="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </Button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  // 사용자 목록 렌더링 부분
  const renderUsersList = () => {
    if (error) {
      return (
        <div className="py-8 text-center">
          <p className="text-red-500">데이터베이스 오류: {error}</p>
          <Button
            variant="secondary"
            onClick={() => globalThis.window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary-DEFAULT text-white rounded hover:bg-primary-dark"
          >
            다시 시도
          </Button>
        </div>
      );
    }

    if (users.length === 0 && !loading) {
      return (
        <div className="py-8 text-center">
          <p className="text-gray-500">조건에 맞는 사용자가 없습니다</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th
                  scope="col"
                  className="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  이름
                </th>
                <th
                  scope="col"
                  className="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  분류
                </th>
                <th
                  scope="col"
                  className="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  나이/성별
                </th>
                <th
                  scope="col"
                  className="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  전화번호
                </th>
                <th
                  scope="col"
                  className="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  인스타그램
                </th>
                <th
                  scope="col"
                  className="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  가입일
                </th>
                <th
                  scope="col"
                  className="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  마지막 접속
                </th>
                <th
                  scope="col"
                  className="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  상태
                </th>
                <th
                  scope="col"
                  className="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => {
                const isBlocked = user.isSuspended;
                const hasReports = false; // user.reports_count && user.reports_count > 0;
                const hasInstagramError = user.statusAt === "instagramerror";

                return (
                  <tr
                    key={user.userId}
                    className={`hover:bg-gray-50 ${isBlocked ? "bg-red-50" : hasReports ? "bg-yellow-50" : hasInstagramError ? "bg-orange-50" : ""}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 mr-3">
                          {user.name ? user.name.charAt(0).toUpperCase() : "?"}
                        </div>
                        <div>
                          <div className="font-medium">
                            {user.name || "이름 없음"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email || "-"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="relative">
                        <Select
                          className="appearance-none bg-transparent border border-gray-300 rounded-md py-1 px-3 pr-8 focus:outline-none focus:ring-primary-DEFAULT focus:border-primary-DEFAULT text-sm"
                          selectedKey={
                            user.rank && user.rank !== "UNKNOWN" ? user.rank : ""
                          }
                          isDisabled={loading}
                          onSelectionChange={(key) =>
                            handleClassificationChange(user, String(key ?? ""))
                          }
                          aria-label="필터"
                        >
                          <HeroSelectLabel className="sr-only">
                            {"필터"}
                          </HeroSelectLabel>
                          <Select.Trigger>
                            <Select.Value />
                            <Select.Indicator />
                          </Select.Trigger>
                          <Select.Popover>
                            <ListBox>
                              <ListBox.Item
                                id={String("")}
                                textValue={"미분류"}
                              >
                                미분류
                              </ListBox.Item>
                              <ListBox.Item id={String("S")} textValue={"S급"}>
                                S급
                              </ListBox.Item>
                              <ListBox.Item id={String("A")} textValue={"A급"}>
                                A급
                              </ListBox.Item>
                              <ListBox.Item id={String("B")} textValue={"B급"}>
                                B급
                              </ListBox.Item>
                              <ListBox.Item id={String("C")} textValue={"C급"}>
                                C급
                              </ListBox.Item>
                            </ListBox>
                          </Select.Popover>
                        </Select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.age ? `${user.age}세` : "-"} /{" "}
                      {getGenderText(user.gender)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {user.phoneNumber || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {user.instagramId ? (
                          <>
                            <a
                              href={`https://www.instagram.com/${user.instagramId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#ff385c] hover:underline"
                            >
                              @{user.instagramId}
                            </a>
                            {user.statusAt === "instagramerror" && (
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                인스타그램 오류
                              </span>
                            )}
                          </>
                        ) : (
                          "-"
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.createdAt
                        ? formatDateWithoutTimezoneConversion(user.createdAt)
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {user.lastActiveAt
                          ? formatDateTimeWithoutTimezoneConversion(
                              user.lastActiveAt,
                            )
                          : "접속 기록 없음"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        {user.isSuspended ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            차단됨
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            사용자
                          </span>
                        )}

                        {user.statusAt === "instagramerror" && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            인스타그램 오류
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <Button
                          variant="secondary"
                          onClick={() => handleUserSelect(user)}
                          className="text-[#ff385c] hover:text-[#e00b41]"
                        >
                          상세정보
                        </Button>

                        {isBlocked ? (
                          <Button
                            variant="secondary"
                            onClick={() =>
                              setStatusTarget({
                                userId: user.userId,
                                name: user.name || user.userId,
                                isSuspended: user.isSuspended,
                              })
                            }
                            className="text-[#ff385c] hover:text-green-700"
                          >
                            차단해제
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            onClick={() =>
handleUserSelect(user, "sanction")
                            }
                            className="text-red-500 hover:text-red-700"
                          >
                            차단
                          </Button>
                        )}

                        {hasReports && (
                          <Button
                            variant="secondary"
                            className="text-yellow-500 hover:text-yellow-700"
                            isDisabled={loading}
                          >
                            신고해제
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        {renderPagination()}

        {/* 페이지 정보 표시 */}
        <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 text-sm text-gray-500">
          총 {totalCount}명의 사용자 중 {users.length}명 표시 중
        </div>
      </div>
    );
  };

  if (loading && users.length === 0) {
    return (
      <div className="py-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-DEFAULT mx-auto"></div>
        <p className="mt-4 text-gray-600">사용자 목록 로딩 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">사용자 관리</h1>

      <div className="bg-white p-4 rounded shadow mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <Select
              className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-DEFAULT"
              selectedKey={String(filter ?? "")}
              isDisabled={undefined}
              onSelectionChange={(key) =>
                ((e) => setFilter(e.target.value))({
                  target: { value: String(key ?? "") },
                } as React.ChangeEvent<HTMLSelectElement>)
              }
              aria-label="필터"
            >
              <HeroSelectLabel className="sr-only">분류 등급</HeroSelectLabel>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  <ListBox.Item id={String("all")} textValue={"모든 사용자"}>
                    모든 사용자
                  </ListBox.Item>
                  <ListBox.Item
                    id={String("blacklisted")}
                    textValue={"차단된 사용자"}
                  >
                    차단된 사용자
                  </ListBox.Item>
                </ListBox>
              </Select.Popover>
            </Select>

            <Select
              className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-DEFAULT"
              selectedKey={String(selectedGender ?? "")}
              isDisabled={undefined}
              onSelectionChange={(key) =>
                ((e) =>
                  setSelectedGender(
                    e.target.value as "all" | "MALE" | "FEMALE",
                  ))({
                  target: { value: String(key ?? "") },
                } as React.ChangeEvent<HTMLSelectElement>)
              }
              aria-label="필터"
            >
              <HeroSelectLabel className="sr-only">사용자 상태</HeroSelectLabel>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  <ListBox.Item id={String("all")} textValue={"전체 성별"}>
                    전체 성별
                  </ListBox.Item>
                  <ListBox.Item id={String("MALE")} textValue={"남성"}>
                    남성
                  </ListBox.Item>
                  <ListBox.Item id={String("FEMALE")} textValue={"여성"}>
                    여성
                  </ListBox.Item>
                </ListBox>
              </Select.Popover>
            </Select>

            <Select
              className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-DEFAULT"
              selectedKey={String(selectedClass ?? "")}
              isDisabled={undefined}
              onSelectionChange={(key) =>
                ((e) =>
                  handleClassChange(
                    e.target.value as
                      | "all"
                      | "S"
                      | "A"
                      | "B"
                      | "C"
                      | "unclassified",
                  ))({
                  target: { value: String(key ?? "") },
                } as React.ChangeEvent<HTMLSelectElement>)
              }
              aria-label="필터"
            >
              <HeroSelectLabel className="sr-only">성별</HeroSelectLabel>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  <ListBox.Item id={String("all")} textValue={"전체 등급"}>
                    전체 등급
                  </ListBox.Item>
                  <ListBox.Item
                    id={String("unclassified")}
                    textValue={"미분류"}
                  >
                    미분류
                  </ListBox.Item>
                  <ListBox.Item id={String("S")} textValue={"S등급"}>
                    S등급
                  </ListBox.Item>
                  <ListBox.Item id={String("A")} textValue={"A등급"}>
                    A등급
                  </ListBox.Item>
                  <ListBox.Item id={String("B")} textValue={"B등급"}>
                    B등급
                  </ListBox.Item>
                  <ListBox.Item id={String("C")} textValue={"C등급"}>
                    C등급
                  </ListBox.Item>
                </ListBox>
              </Select.Popover>
            </Select>

            <div className="relative">
              <Input
                type="text"
                placeholder="사용자 검색..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="border rounded pl-10 pr-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-primary-DEFAULT"
                aria-label={"사용자 검색..."}
              />
              <svg
                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                ></path>
              </svg>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button
              variant="secondary"
              onClick={() => fetchUsers()}
              className="bg-primary-DEFAULT hover:bg-primary-dark text-white py-2 px-4 rounded"
              isDisabled={loading}
            >
              새로고침
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {selectedGender !== "all" && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#ffd1da] text-[#e00b41] gap-2">
              {selectedGender === "MALE" ? "남성" : "여성"}
              <Button
                variant="secondary"
                onClick={() => setSelectedGender("all")}
                className="hover:bg-[#ffd1da] rounded-full p-1"
                aria-label="성별 필터 제거"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </Button>
            </span>
          )}
          {selectedClass !== "all" && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#ffd1da] text-[#e00b41] gap-2">
              {selectedClass}등급
              <Button
                variant="secondary"
                onClick={() => setSelectedClass("all")}
                className="hover:bg-[#fff5f7] rounded-full p-1"
                aria-label="등급 필터 제거"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </Button>
            </span>
          )}
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow mb-6">
        <p className="text-gray-700">
          총 {totalCount}명의 사용자가 등록되어 있습니다.
        </p>
      </div>

      {renderUsersList()}

      {/* 사용자 상세 정보 모달 */}
      {selectedUser && (
        <Modal.Backdrop
          isOpen
          isDismissable={!sanctionBusy}
          isKeyboardDismissDisabled={sanctionBusy}
          onOpenChange={(isOpen) => {
            if (!isOpen) handleCloseDetails();
          }}
        >
          <Modal.Container size="lg" scroll="inside" className="w-full">
            <Modal.Dialog style={{ width: "100%", maxWidth: "56rem" }}>
            {/* 헤더 */}
            <Modal.Header className="border-b pb-4">
              <div className="flex w-full items-center justify-between gap-2">
                <Modal.Heading className="text-2xl font-bold">
                  사용자 상세 정보
                </Modal.Heading>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    onClick={() =>
                      setExposureSheetUser({
                        userId: selectedUser.userId,
                        name: selectedUser.name,
                      })
                    }
                    className="text-xs px-3 py-1.5 rounded-md border border-[#ffd1da] text-[#e00b41] hover:bg-[#f7f7f7] transition-colors"
                  >
                    Ghost 노출 이력
                  </Button>
                  <Link
                    href={`/admin/ai-profiles/ghosts/users/${selectedUser.userId}?userName=${encodeURIComponent(selectedUser.name)}`}
                    className="text-xs px-3 py-1.5 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                    title="전체 화면으로 열기"
                  >
                    전체 화면
                  </Link>
                  <Button
                    variant="secondary"
                    onClick={handleCloseDetails}
                    isDisabled={sanctionBusy}
                    aria-label="사용자 상세 닫기"
                    className="text-gray-500 hover:text-gray-700 p-2"
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
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </Button>
                </div>
              </div>
            </Modal.Header>

            {/* 컨텐츠 */}
            <Modal.Body>
              <p className="text-sm mb-3 break-all">{selectedUser.name} · {selectedUser.userId} · {country.toUpperCase()} · {selectedUser.isSuspended ? "정지" : "정상"}</p>
              <div role="tablist" aria-label="사용자 상세" className="flex gap-2 mb-4">
                {([['info', '회원 정보'], ['sanction', '제재·환불 안내']] as const).map(([tab, label]) => <button key={tab} type="button" role="tab" id={`user-${tab}-tab`} aria-selected={detailTab === tab} aria-controls={`user-${tab}-panel`} tabIndex={detailTab === tab ? 0 : -1} disabled={sanctionBusy} className={`rounded-lg px-4 py-2 ${detailTab === tab ? "bg-gray-900 text-white" : "bg-gray-100"}`} onClick={() => setDetailTab(tab)} onKeyDown={event => {
                  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key) || sanctionBusy) return;
                  event.preventDefault();
                  const next = event.key === "Home" ? "info" : event.key === "End" ? "sanction" : detailTab === "info" ? "sanction" : "info";
                  setDetailTab(next); document.getElementById(`user-${next}-tab`)?.focus();
                }}>{label}</button>)}
              </div>
              <div role="tabpanel" id="user-sanction-panel" aria-labelledby="user-sanction-tab" hidden={detailTab !== "sanction"}>
                <SanctionNoticePanel key={`${country}:${selectedUser.userId}`} country={country} userId={selectedUser.userId} userName={selectedUser.name} isSuspended={selectedUser.isSuspended} onBusyChange={setSanctionBusy} onLater={handleCloseDetails} onChanged={async (message) => {
                  const userId = selectedUser.userId;
                  const requestCountry = country;
                  toast.success(message);
                  // Keep successful sanction visible even if subsequent refresh fails.
                  setSelectedUser(current => current?.userId === userId ? { ...current, isSuspended: !message.includes("해제") } : current);
                  const detail = await AdminService.userAppearance.getUserDetails(userId);
                  if (countryRef.current !== requestCountry) return;
                  setSelectedUser(current => current?.userId === userId ? { ...current, ...detail, userId } : current);
                  await fetchUsers(true);
                }} />
              </div>
              <div role="tabpanel" id="user-info-panel" aria-labelledby="user-info-tab" hidden={detailTab !== "info"}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 왼쪽 컬럼 */}
                <div className="space-y-6">
                  <div className="space-y-4">
                    {/* 메인 이미지 */}
                    <div className="flex justify-center">
                      <HeroActionButton
                        variant="ghost"
                        className="h-48 w-48 rounded-lg bg-gray-200 flex items-center justify-center text-gray-600 text-4xl overflow-hidden"
                        onClick={() => {
                          // 메인 이미지 찾기
                          const mainImage = selectedUser.profileImages?.find(
                            (img) => img.isMain === true,
                          );
                          if (mainImage) {
                          }
                        }}
                      >
                        {selectedImage ? (
                          <img
                            src={selectedImage}
                            alt={selectedUser.name}
                            className="h-full w-full object-cover"
                          />
                        ) : selectedUser.profileImages &&
                          selectedUser.profileImages.length > 0 ? (
                          <img
                            src={selectedUser.profileImages[0].url}
                            alt={selectedUser.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          selectedUser.name.charAt(0).toUpperCase()
                        )}
                      </HeroActionButton>
                    </div>

                    {/* 이미지 썸네일 목록 */}
                    {selectedUser.profileImages &&
                      selectedUser.profileImages.length > 1 && (
                        <div className="flex justify-center gap-2 flex-wrap">
                          {selectedUser.profileImages.map((image, index) => (
                            <HeroActionButton
                              variant="ghost"
                              key={image.id}
                              className={`h-16 w-16 rounded-md overflow-hidden cursor-pointer border-2 ${
                                selectedImage === image.url
                                  ? "border-[#ff385c]"
                                  : "border-transparent"
                              }`}
                              onClick={() => {
                                // 직접 상태 업데이트
                                setSelectedImage(image.url);
                              }}
                            >
                              <img
                                src={image.url}
                                alt={`${selectedUser.name} 프로필 이미지 ${index + 1}`}
                                className="h-full w-full object-cover"
                              />
                            </HeroActionButton>
                          ))}
                        </div>
                      )}
                  </div>

                  <BlindAvatarSources key={`${country}:${selectedUser.userId}`} userId={selectedUser.userId} />

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">기본 정보</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">이름</p>
                        <p className="font-medium">{selectedUser.name}</p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500">나이</p>
                        <p className="font-medium">{selectedUser.age}세</p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500">성별</p>
                        <p className="font-medium">
                          {getGenderText(selectedUser.gender)}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500">인스타그램</p>
                        <p className="font-medium">
                          {selectedUser.instagramId ? (
                            <a
                              href={`https://www.instagram.com/${selectedUser.instagramId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#ff385c] hover:underline"
                            >
                              @{selectedUser.instagramId}
                            </a>
                          ) : (
                            "-"
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {selectedUser.universityDetails && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold mb-4">
                        대학교 정보
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-500">학교명</p>
                          <p className="font-medium">
                            {selectedUser.universityDetails.name}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500">학과</p>
                          <p className="font-medium">
                            {selectedUser.universityDetails.department}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500">인증 상태</p>
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              selectedUser.universityDetails?.authentication
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {selectedUser.universityDetails?.authentication
                              ? "인증됨"
                              : "미인증"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 오른쪽 컬럼 - 선호도 정보 */}
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">선호도 정보</h3>
                    <div className="space-y-6">
                      {/* 프로필 정보 */}
                      {selectedUser.preferences?.self &&
                        Array.isArray(selectedUser.preferences.self) &&
                        selectedUser.preferences.self.length > 0 && (
                          <div>
                            <h4 className="text-md font-semibold mb-3 text-[#e00b41]">
                              프로필 정보
                            </h4>
                            <div className="space-y-3">
                              {selectedUser.preferences.self.map(
                                (pref, index) => (
                                  <div
                                    key={index}
                                    className="border-b border-gray-200 pb-3 last:border-0"
                                  >
                                    <p className="text-sm text-gray-500 mb-1">
                                      {pref.typeName}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                      {pref.selectedOptions.map(
                                        (option, optIndex) => (
                                          <span
                                            key={optIndex}
                                            className="px-2 py-1 bg-[#ffd1da] text-[#e00b41] text-sm rounded-full"
                                          >
                                            {option.displayName}
                                          </span>
                                        ),
                                      )}
                                    </div>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        )}

                      {/* 이상형 정보 */}
                      {selectedUser.preferences?.partner &&
                        Array.isArray(selectedUser.preferences.partner) &&
                        selectedUser.preferences.partner.length > 0 && (
                          <div>
                            <h4 className="text-md font-semibold mb-3 text-[#e00b41]">
                              이상형 정보
                            </h4>
                            <div className="space-y-3">
                              {selectedUser.preferences.partner.map(
                                (pref, index) => (
                                  <div
                                    key={index}
                                    className="border-b border-gray-200 pb-3 last:border-0"
                                  >
                                    <p className="text-sm text-gray-500 mb-1">
                                      {pref.typeName}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                      {pref.selectedOptions.map(
                                        (option, optIndex) => (
                                          <span
                                            key={optIndex}
                                            className="px-2 py-1 bg-[#ffd1da] text-[#e00b41] text-sm rounded-full"
                                          >
                                            {option.displayName}
                                          </span>
                                        ),
                                      )}
                                    </div>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        )}

                      {/* 선호도 정보가 없는 경우 */}
                      {(!selectedUser.preferences?.self ||
                        selectedUser.preferences.self.length === 0) &&
                        (!selectedUser.preferences?.partner ||
                          selectedUser.preferences.partner.length === 0) && (
                          <p className="text-gray-500 text-sm">
                            등록된 선호도 정보가 없습니다.
                          </p>
                        )}
                    </div>
                  </div>
                </div>
              </div>
              </div>
            </Modal.Body>

            {/* 하단 버튼 */}
            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={handleCloseDetails}
                isDisabled={sanctionBusy}
                className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                닫기
              </Button>
            </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      )}

      {statusTarget && (
        <AccountStatusModal
          open
          onClose={() => setStatusTarget(null)}
          userId={statusTarget.userId}
          userName={statusTarget.name}
          isSuspended={statusTarget.isSuspended}
          onSuccess={(message) => {
            toast.success(message);
            void fetchUsers();
          }}
        />
      )}

      {/* Ghost 노출 이력 Sheet */}
      <GhostUserExposureSheet
        userId={exposureSheetUser?.userId ?? null}
        userName={exposureSheetUser?.name}
        onClose={() => setExposureSheetUser(null)}
        onGhostSelect={(ghostAccountId) => {
          router.push(
            `/admin/ai-profiles/ghosts?ghostAccountId=${ghostAccountId}`,
          );
        }}
      />
    </div>
  );
}

export default function UsersV2() {
  return <UsersV2Content />;
}
