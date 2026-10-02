"use client";
import { Button as HeroActionButton } from "@heroui/react";
import {
  Alert,
  Avatar,
  Button,
  Card,
  Chip,
  Input,
  Label,
  ListBox,
  Modal,
  Pagination,
  Select,
  Spinner,
  Tabs,
  TextArea,
  TextField,
} from "@heroui/react";

import { Check, X } from "lucide-react";

import React, { useState, useEffect } from "react";

import { adminGet, adminPatch } from "@/shared/lib/http/admin-fetch";
import UserDetailModal, { UserDetail } from "./UserDetailModal";
import RegionFilter, {
  useRegionFilter,
} from "@/components/admin/common/RegionFilter";

import AdminService from "@/app/services/admin";
import { useToast } from "@/shared/ui/admin/toast";

interface PendingUser {
  id?: string;
  userId?: string;
  name: string;
  age?: number;
  birthday?: string;
  phone?: string;
  phoneNumber?: string;
  profileImageUrl?: string;
  instagramId?: string;
  instagramUrl?: string;
  university?: string;
  region?: string;
  createdAt: string;
  status: "pending" | "rejected";
  rejectionReason?: string;
  lastPushNotificationAt?: string;
  signupRoute?: "PASS" | "KAKAO" | "APPLE";
}

const ApprovalManagementPanel: React.FC = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState(0); // 0: pending, 1: rejected, 2: reapply
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [rejectedUsers, setRejectedUsers] = useState<PendingUser[]>([]);
  const [reapplyUsers, setReapplyUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pendingCount, setPendingCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [reapplyCount, setReapplyCount] = useState(0);

  // 모바일 감지 훅
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  // 지역 필터 훅 사용
  const {
    region,
    setRegion: setRegionFilter,
    getRegionParam,
  } = useRegionFilter();

  // 이름 검색 상태
  const [nameSearch, setNameSearch] = useState<string>("");

  // 승인/거부 모달 상태
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [customRejectionReason, setCustomRejectionReason] = useState("");

  // 거부 모달을 열거나 닫을 때(백드롭/Esc 포함) 이전 사유가 남지 않게 초기화
  useEffect(() => {
    setRejectionReason("");
    setCustomRejectionReason("");
  }, [rejectionModalOpen]);

  // 거부 사유 옵션들
  const rejectionReasons = [
    // 장기 미접속
    {
      value: "LONG_TERM_INACTIVE_REAPPLY",
      label: "[장기 미접속]-재심사를 요청해주세요",
    },

    // 프로필 사진 관련
    {
      value: "PROFILE_PHOTO_CLEAR_FACE",
      label: "프로필 사진을 본인 얼굴이 잘 보이는 사진으로 변경해주세요",
    },
    {
      value: "PROFILE_PHOTO_SELF",
      label: "본인 사진으로 프로필을 변경해주세요",
    },
    {
      value: "PROFILE_PHOTO_NATURAL",
      label: "상대방이 봐도 부담스럽지 않은 자연스러운 사진으로 변경해주세요",
    },
    {
      value: "PROFILE_PHOTO_FORMAT_UNSUPPORTED",
      label: "프로필 이미지 형식 지원 안함(jpg, jpeg, png 지원)",
    },

    // 인스타그램 ID 관련
    {
      value: "INSTAGRAM_ID_CORRECT",
      label: "인스타그램 ID를 정확히 입력해주세요",
    },
    {
      value: "INSTAGRAM_ID_MAIN_ACCOUNT",
      label: "인스타그램 본계정으로 변경해주세요",
    },
    {
      value: "INSTAGRAM_ID_PUBLIC",
      label: "인스타그램을 공개계정으로 설정해주세요",
    },
    {
      value: "INSTAGRAM_ID_ACTIVE",
      label: "활동 내역이 있는 인스타그램 계정으로 변경해주세요",
    },
    {
      value: "INSTAGRAM_ID_VERIFIABLE",
      label: "본인 확인이 가능한 인스타그램 계정으로 변경해주세요",
    },

    // 복합 사유
    {
      value: "BOTH_PROFILE_AND_INSTAGRAM",
      label: "프로필 사진과 인스타그램 ID 모두 수정 후 재신청해주세요",
    },

    // 이용 조건 관련
    {
      value: "NOT_ELIGIBLE",
      label: "현재 썸타임 이용 조건에 맞지 않아 승인이 어렵습니다",
    },
    {
      value: "FOREIGN_STUDENT_NOT_ACCEPTED",
      label: "죄송하지만 현재 외국인 유학생 회원가입을 받고 있지 않습니다",
    },

    // 신뢰성 검증 관련
    {
      value: "IDENTITY_VERIFICATION_DIFFICULT",
      label: "본인 확인이 어려워 승인이 어렵습니다",
    },
    {
      value: "RELIABLE_PROFILE_REQUIRED",
      label: "신뢰할 수 있는 프로필 정보로 수정 후 재신청해주세요",
    },

    // 기타
    { value: "OTHER", label: "기타 (직접 입력)" },
  ];
  const [processing, setProcessing] = useState(false);

  // 사용자 상세 모달 상태
  const [userDetailModalOpen, setUserDetailModalOpen] = useState(false);
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [loadingUserDetail, setLoadingUserDetail] = useState(false);
  const [userDetailError, setUserDetailError] = useState<string | null>(null);

  const limit = 10;

  // 사용자 ID 가져오기 헬퍼 함수
  const getUserId = (user: PendingUser): string => {
    return user.id || user.userId || "";
  };

  // 사용자 전화번호 가져오기 헬퍼 함수
  const getUserPhone = (user: PendingUser): string => {
    return user.phone || user.phoneNumber || "";
  };

  // 지역 한글 표시 함수
  const getRegionLabel = (region?: string) => {
    const regionMap: Record<string, string> = {
      DJN: "대전",
      SJG: "세종",
      CJU: "청주",
      BSN: "부산",
      DGU: "대구",
      GJJ: "공주",
      GHE: "김해",
      ICN: "인천",
      SEL: "서울",
      KYG: "경기",
      CAN: "천안",
      GWJ: "광주",
      GNG: "강원",
      JJA: "제주",
    };
    return region ? regionMap[region] || region : "-";
  };

  // 회원가입 루트 한글 표시 함수
  const getSignupRouteLabel = (signupRoute?: string) => {
    const routeMap: Record<string, string> = {
      PASS: "PASS",
      KAKAO: "카카오",
      APPLE: "애플",
    };
    return signupRoute ? routeMap[signupRoute] || signupRoute : "-";
  };

  // 거절 사유 한글 표시 함수
  const getRejectionReasonLabel = (reason?: string) => {
    const reasonMap: Record<string, string> = {
      PROFILE_PHOTO_CLEAR_FACE:
        "프로필 사진을 본인 얼굴이 잘 보이는 사진으로 변경해주세요",
      PROFILE_PHOTO_SELF: "본인 사진으로 프로필을 변경해주세요",
      PROFILE_PHOTO_NATURAL:
        "상대방이 봐도 부담스럽지 않은 자연스러운 사진으로 변경해주세요",
      PROFILE_PHOTO_FORMAT_UNSUPPORTED:
        "프로필 이미지 형식 지원 안함(jpg, jpeg, png 지원)",
      INSTAGRAM_ID_CORRECT: "인스타그램 ID를 정확히 입력해주세요",
      INSTAGRAM_ID_MAIN_ACCOUNT: "인스타그램 본계정으로 변경해주세요",
      INSTAGRAM_ID_PUBLIC: "인스타그램을 공개계정으로 설정해주세요",
      INSTAGRAM_ID_ACTIVE: "활동 내역이 있는 인스타그램 계정으로 변경해주세요",
      INSTAGRAM_ID_VERIFIABLE:
        "본인 확인이 가능한 인스타그램 계정으로 변경해주세요",
      BOTH_PROFILE_AND_INSTAGRAM:
        "프로필 사진과 인스타그램 ID 모두 수정 후 재신청해주세요",
      NOT_ELIGIBLE: "현재 썸타임 이용 조건에 맞지 않아 승인이 어렵습니다",
      LONG_TERM_INACTIVE_REAPPLY: "[장기 미접속]-재심사를 요청해주세요",
      FOREIGN_STUDENT_NOT_ACCEPTED:
        "죄송하지만 현재 외국인 유학생 회원가입을 받고 있지 않습니다",
      IDENTITY_VERIFICATION_DIFFICULT: "본인 확인이 어려워 승인이 어렵습니다",
      RELIABLE_PROFILE_REQUIRED:
        "신뢰할 수 있는 프로필 정보로 수정 후 재신청해주세요",
      OTHER: "기타",
      reapply: "재심사 요청",
    };
    return reason ? reasonMap[reason] || reason : "-";
  };

  // 탭 변경 핸들러
  const handleTabChange = (
    _: React.SyntheticEvent | null,
    newValue: number,
  ) => {
    setActiveTab(newValue);
    setPage(1);
  };

  // 지역 변경 시 페이지 초기화
  useEffect(() => {
    setPage(1);
  }, [region]);

  // 이름 검색 변경 시 페이지 초기화
  useEffect(() => {
    setPage(1);
  }, [nameSearch]);

  // 데이터 로드
  useEffect(() => {
    fetchUsers();
  }, [activeTab, page, region, nameSearch]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const regionParam = getRegionParam();

      // 현재 탭에 따라 적절한 API 호출
      const [
        currentResponse,
        pendingResponse,
        rejectedResponse,
        reapplyResponse,
      ] = await Promise.all([
        // 현재 탭 데이터
        activeTab === 0
          ? AdminService.userAppearance.getPendingUsers(
              page,
              limit,
              regionParam,
              nameSearch || undefined,
            )
          : activeTab === 1
            ? AdminService.userAppearance.getRejectedUsers(
                page,
                limit,
                regionParam,
                nameSearch || undefined,
              )
            : AdminService.userAppearance.getReapplyUsers(
                page,
                limit,
                regionParam,
                nameSearch || undefined,
              ),

        // 다른 탭들의 카운트를 위한 데이터 (첫 페이지만)
        activeTab !== 0
          ? AdminService.userAppearance.getPendingUsers(
              1,
              10,
              regionParam,
              nameSearch || undefined,
            )
          : null,
        activeTab !== 1
          ? AdminService.userAppearance.getRejectedUsers(
              1,
              10,
              regionParam,
              nameSearch || undefined,
            )
          : null,
        activeTab !== 2
          ? AdminService.userAppearance.getReapplyUsers(
              1,
              10,
              regionParam,
              nameSearch || undefined,
            )
          : null,
      ]);

      const users = currentResponse.data || [];
      const currentMeta = currentResponse.meta || {};

      // 현재 탭 데이터 설정
      if (activeTab === 0) {
        setPendingUsers(users);
        setPendingCount(currentMeta.total || users.length);
      } else if (activeTab === 1) {
        setRejectedUsers(users);
        setRejectedCount(currentMeta.total || users.length);
      } else {
        setReapplyUsers(users);
        setReapplyCount(currentMeta.total || users.length);
      }

      // 다른 탭들의 카운트 설정
      if (pendingResponse && activeTab !== 0) {
        setPendingCount(pendingResponse.meta?.total || 0);
      }
      if (rejectedResponse && activeTab !== 1) {
        setRejectedCount(rejectedResponse.meta?.total || 0);
      }
      if (reapplyResponse && activeTab !== 2) {
        setReapplyCount(reapplyResponse.meta?.total || 0);
      }

      setTotalPages(
        currentMeta.totalPages ||
          Math.ceil((currentMeta.total || users.length) / limit),
      );
    } catch (err: any) {
      console.error("승인 대기 사용자 조회 오류:", err);
      setError("사용자 목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 사용자 상세 정보 조회
  const fetchUserDetail = async (userId: string) => {
    setLoadingUserDetail(true);
    setUserDetailError(null);

    try {
      const userData = await adminGet<any>(`/admin/users/detail/${userId}`);

      // API 응답 데이터를 UserDetail 형식에 맞게 변환
      const userDetail: UserDetail = {
        id: userData.id || userData.userId,
        name: userData.name,
        age: userData.age,
        birthday: userData.birthday,
        gender: userData.gender,
        profileImages: userData.profileImages || [],
        profileImageUrl: userData.profileImageUrl,
        phoneNumber: userData.phoneNumber || userData.phone,
        instagramId: userData.instagramId,
        instagramUrl: userData.instagramUrl,
        university: userData.university,
        email: userData.email,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
        lastActiveAt: userData.lastActiveAt,
        appearanceGrade: userData.appearanceGrade,
        accountStatus: userData.accountStatus,
        ...userData, // 기타 필드들
      };

      setUserDetail(userDetail);
      setUserDetailModalOpen(true);
    } catch (err: any) {
      console.error("사용자 상세 정보 조회 오류:", err);
      setUserDetailError("사용자 상세 정보를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoadingUserDetail(false);
    }
  };

  // 승인 처리
  const handleApproval = async () => {
    if (!selectedUserId) return;

    setProcessing(true);
    try {
      await adminPatch(`/admin/users/approval/${selectedUserId}/status`, {
        status: "approved",
      });

      setApprovalModalOpen(false);
      setSelectedUserId(null);
      fetchUsers(); // 목록 및 카운트 새로고침
    } catch (err: any) {
      console.error("승인 처리 오류:", err);
      setError("승인 처리 중 오류가 발생했습니다.");
      toast.error("승인 처리 중 오류가 발생했습니다.");
    } finally {
      setProcessing(false);
    }
  };

  // 거부 처리
  const handleRejection = async () => {
    if (!selectedUserId || !rejectionReason.trim()) return;

    // 기타 사유인 경우 customRejectionReason이 필요
    if (rejectionReason === "OTHER" && !customRejectionReason.trim()) return;

    setProcessing(true);
    try {
      const finalRejectionReason =
        rejectionReason === "OTHER"
          ? customRejectionReason.trim()
          : getRejectionReasonLabel(rejectionReason);

      await adminPatch(`/admin/users/approval/${selectedUserId}/status`, {
        status: "rejected",
        rejectionReason: finalRejectionReason,
      });

      setRejectionModalOpen(false);
      setSelectedUserId(null);
      setRejectionReason("");
      setCustomRejectionReason("");
      fetchUsers(); // 목록 및 카운트 새로고침
    } catch (err: any) {
      console.error("거부 처리 오류:", err);
      setError("거부 처리 중 오류가 발생했습니다.");
      toast.error("거부 처리 중 오류가 발생했습니다.");
    } finally {
      setProcessing(false);
    }
  };

  const currentUsers =
    activeTab === 0
      ? pendingUsers
      : activeTab === 1
        ? rejectedUsers
        : reapplyUsers;

  return (
    <div>
      <div
        style={{ fontSize: "1.5rem" }}
        className={"text-lg font-semibold text-neutral-900"}
      >
        회원가입 승인 관리
      </div>
      {/* 이전 안내 Alert */}
      <Alert style={{ marginBottom: 12 }} status={"warning"} role="alert">
        <Alert.Content>
          <div
            style={{ fontWeight: 600, marginBottom: 4 }}
            className={"text-lg font-semibold text-neutral-900"}
          >
            ⚠️ 메뉴 이전 안내
          </div>
          <div
            style={{ marginBottom: 4 }}
            className={"text-sm text-neutral-700"}
          >
            회원가입 승인 관리 기능이{" "}
            <strong>&quot;회원 적격 심사&quot;</strong>메뉴로 이전되었습니다.
          </div>
          <div className={"text-sm text-neutral-700"}>
            • 새로운 메뉴에서 프로필 이미지 개별 심사와 사용자 정보를 한눈에
            확인할 수 있습니다.
            <br />• 좌측 사이드바에서{" "}
            <strong>&quot;회원 적격 심사&quot;</strong>메뉴를 이용해주세요.
          </div>
          <div style={{ marginTop: 8 }}>
            <a
              href="/admin/profile-review"
              style={{
                color: "#7A4AE2",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              → 회원 적격 심사 메뉴로 이동하기
            </a>
          </div>
        </Alert.Content>
      </Alert>
      {error && (
        <Alert style={{ marginBottom: 8 }} status="danger" role="alert">
          <Alert.Content>{error}</Alert.Content>
        </Alert>
      )}
      {/* 필터 영역 */}
      <div
        style={{
          marginBottom: 12,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          alignItems: "stretch",
        }}
      >
        {/* 지역 필터 */}
        <RegionFilter
          value={region}
          onChange={setRegionFilter}
          size={isMobile ? "medium" : "small"}
          sx={{ minWidth: isMobile ? "100%" : 150 }}
        />
        {/* 이름 검색 */}
        <TextField
          className="w-full"
          isDisabled={undefined}
          isInvalid={undefined}
        >
          <Label>{"이름 검색"}</Label>
          <Input
            value={nameSearch}
            onChange={(e) => setNameSearch(e.target.value)}
            style={{ minWidth: "100%" }}
            placeholder="사용자 이름을 입력하세요"
            aria-label={"이름 검색"}
          />
        </TextField>
      </div>
      {/* 탭 메뉴 */}
      <Tabs
        selectedKey={activeTab}
        onSelectionChange={(key) => handleTabChange(null, Number(key))}
      >
        <Tabs.List aria-label="목록 보기">
          <Tabs.Tab id={0}>
            {isMobile
              ? `대기 (${pendingCount})`
              : `승인 대기 (${pendingCount})`}
          </Tabs.Tab>
          <Tabs.Tab id={1}>
            {isMobile
              ? `거부 (${rejectedCount})`
              : `승인 거부 (${rejectedCount})`}
          </Tabs.Tab>
          <Tabs.Tab id={2}>
            {isMobile
              ? `재심사 (${reapplyCount})`
              : `재심사 요청 (${reapplyCount})`}
          </Tabs.Tab>
        </Tabs.List>
      </Tabs>
      {/* MARK: - 모바일: 카드 레이아웃 */}
      {isMobile ? (
        <div className={"flex flex-wrap items-center gap-2"}>
          {loading ? (
            <div
              style={{ display: "flex", justifyContent: "center", padding: 12 }}
            >
              <Spinner aria-label="불러오는 중" size="sm" />
            </div>
          ) : currentUsers.length === 0 ? (
            <div
              style={{ padding: 12 }}
              className={"text-sm text-neutral-700"}
            ></div>
          ) : (
            currentUsers.map((user) => (
              <Card key={getUserId(user)} style={{ width: "100%" }}>
                {/* 수직 레이아웃 */}
                <Card.Content>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <HeroActionButton
                      variant="ghost"
                      className="h-auto min-w-0 p-0"
                      onClick={() => fetchUserDetail(getUserId(user))}
                      aria-label="프로필 상세 보기"
                    >
                      <Avatar style={{ width: 50, height: 50, marginRight: 8 }}>
                        <Avatar.Image
                          src={user.profileImageUrl}
                          alt={user.name}
                        />
                        <Avatar.Fallback></Avatar.Fallback>
                      </Avatar>
                    </HeroActionButton>
                    <div style={{ flex: 1 }}>
                      <div className={"text-sm text-neutral-700"}>
                        {user.name}
                      </div>
                      <div className={"text-sm text-neutral-700"}>
                        {user.birthday ? (
                          <>
                            생년월일:{" "}
                            {new Date(user.birthday).toLocaleDateString(
                              "ko-KR",
                            )}
                            {user.age && ` (${user.age}세)`}
                          </>
                        ) : user.age ? (
                          `나이: ${user.age}세`
                        ) : (
                          ""
                        )}
                      </div>
                      <div
                        style={{ display: "block" }}
                        className={"text-sm text-neutral-700"}
                      >
                        가입일:{" "}
                        {new Date(user.createdAt).toLocaleDateString("ko-KR")}
                      </div>
                    </div>
                    {/*TODO: - 상태 라벨 및 색상 지정 */}
                  </div>
                  <div
                    style={{ marginBottom: 8 }}
                    className={"flex flex-wrap items-center gap-2"}
                  >
                    <div className={"text-sm text-neutral-700"}>
                      {getUserPhone(user)}
                    </div>
                    <div className={"text-sm text-neutral-700"}>
                      {user.instagramId || "-"}
                    </div>
                    <div className={"text-sm text-neutral-700"}>
                      {user.university || "-"}
                    </div>
                    <div className={"text-sm text-neutral-700"}>
                      {getRegionLabel(user.region)}
                    </div>
                    <div className={"text-sm text-neutral-700"}>
                      가입 루트: {getSignupRouteLabel(user.signupRoute)}
                    </div>
                    {(activeTab === 1 || activeTab === 2) &&
                      user.rejectionReason && (
                        <div className={"text-sm text-neutral-700"}>
                          거부 사유 :{" "}
                          {getRejectionReasonLabel(user.rejectionReason)}
                        </div>
                      )}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 4,
                      justifyContent: "flex-end",
                    }}
                  >
                    <Button
                      variant={"ghost"}
                      isDisabled={undefined}
                      isIconOnly={true}
                      size={"md"}
                      className="rounded-lg"
                    ></Button>
                    <Button
                      onClick={() => {
                        setSelectedUserId(getUserId(user));
                        setApprovalModalOpen(true);
                      }}
                      variant={"ghost"}
                      isDisabled={undefined}
                      isIconOnly={true}
                      size={"sm"}
                      className="rounded-lg"
                    >
                      <Check />
                    </Button>
                    {user.status === "pending" && (
                      <>
                        <Button
                          onClick={() => {
                            setSelectedUserId(getUserId(user));
                            setRejectionModalOpen(true);
                          }}
                          variant={"ghost"}
                          isDisabled={undefined}
                          isIconOnly={true}
                          size={"sm"}
                          className="rounded-lg"
                        >
                          <X />
                        </Button>
                      </>
                    )}
                  </div>
                </Card.Content>
              </Card>
            ))
          )}
        </div>
      ) : (
        <div className={"overflow-x-auto"}>
          <table
            className={
              "w-full text-sm text-left [&_td]:p-3 [&_thead]:bg-neutral-50 [&_tr]:border-b"
            }
          >
            <thead>
              <tr>
                <th>프로필</th>
                <th>이름</th>
                <th>생년월일(나이)</th>
                <th>전화번호</th>
                <th>인스타그램 ID</th>
                <th>대학교</th>
                <th>지역</th>
                <th>가입일</th>
                <th>회원가입 루트</th>
                <th>상태</th>
                {(activeTab === 1 || activeTab === 2) && <th>거부 사유</th>}
                <th>마지막 알림 발송</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={activeTab === 1 || activeTab === 2 ? 13 : 12}>
                    <Spinner aria-label="불러오는 중" size="sm" />
                  </td>
                </tr>
              ) : currentUsers.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 1 || activeTab === 2 ? 13 : 12}>
                    {activeTab === 0
                      ? "승인 대기 중인 사용자가 없습니다."
                      : activeTab === 1
                        ? "승인 거부된 사용자가 없습니다."
                        : "재심사 요청한 사용자가 없습니다."}
                  </td>
                </tr>
              ) : (
                currentUsers.map((user) => (
                  <tr key={getUserId(user)}>
                    <td>
                      <HeroActionButton
                        variant="ghost"
                        className="h-auto min-w-0 p-0"
                        onClick={() => fetchUserDetail(getUserId(user))}
                        aria-label="프로필 상세 보기"
                      >
                        <Avatar
                          style={{ width: 40, height: 40, cursor: "pointer" }}
                        >
                          <Avatar.Image
                            src={user.profileImageUrl}
                            alt={user.name}
                          />
                          <Avatar.Fallback></Avatar.Fallback>
                        </Avatar>
                      </HeroActionButton>
                    </td>
                    <td>{user.name}</td>
                    <td>
                      {user.birthday ? (
                        <>
                          {new Date(user.birthday).toLocaleDateString("ko-KR")}
                          {user.age && ` (${user.age}세)`}
                        </>
                      ) : user.age ? (
                        `${user.age}세`
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>{getUserPhone(user)}</td>
                    <td>
                      {user.instagramId ? (
                        <a
                          href={
                            user.instagramUrl ||
                            `https://www.instagram.com/${user.instagramId}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ textDecoration: "none", color: "#7A4AE2" }}
                        >
                          {user.instagramId}
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>{user.university || "-"}</td>
                    <td>{getRegionLabel(user.region)}</td>
                    <td>
                      {new Date(user.createdAt).toLocaleDateString("ko-KR")}
                    </td>
                    <td>{getSignupRouteLabel(user.signupRoute)}</td>
                    <td>
                      <Chip size={"sm"} variant={"soft"}>
                        {user.status === "pending"
                          ? user.rejectionReason === "reapply"
                            ? "재심사 요청"
                            : "승인 대기"
                          : "승인 거부"}
                      </Chip>
                    </td>
                    {(activeTab === 1 || activeTab === 2) && (
                      <td>{getRejectionReasonLabel(user.rejectionReason)}</td>
                    )}
                    <td>
                      {(user as any).lastPushNotificationAt
                        ? new Date(
                            (user as any).lastPushNotificationAt,
                          ).toLocaleDateString("ko-KR", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 4 }}>
                        <Button
                          onClick={() => fetchUserDetail(getUserId(user))}
                          variant={"secondary"}
                          isDisabled={undefined}
                          size={"sm"}
                          className="rounded-xl"
                        >
                          상세보기
                        </Button>
                        {user.status === "pending" &&
                          user.rejectionReason !== "reapply" && (
                            <>
                              <Button
                                onClick={() => {
                                  setSelectedUserId(getUserId(user));
                                  setApprovalModalOpen(true);
                                }}
                                variant={"primary"}
                                isDisabled={undefined}
                                size={"sm"}
                                className="rounded-xl"
                              >
                                승인
                              </Button>
                              <Button
                                onClick={() => {
                                  setSelectedUserId(getUserId(user));
                                  setRejectionModalOpen(true);
                                }}
                                variant={"primary"}
                                isDisabled={undefined}
                                size={"sm"}
                                className="rounded-xl"
                              >
                                거부
                              </Button>
                            </>
                          )}
                        {user.status === "pending" &&
                          user.rejectionReason === "reapply" && (
                            <>
                              <Button
                                onClick={() => {
                                  setSelectedUserId(getUserId(user));
                                  setApprovalModalOpen(true);
                                }}
                                variant={"primary"}
                                isDisabled={undefined}
                                size={"sm"}
                                className="rounded-xl"
                              >
                                승인
                              </Button>
                              <Button
                                onClick={() => {
                                  setSelectedUserId(getUserId(user));
                                  setRejectionModalOpen(true);
                                }}
                                variant={"primary"}
                                isDisabled={undefined}
                                size={"sm"}
                                className="rounded-xl"
                              >
                                거부
                              </Button>
                            </>
                          )}
                        {user.status === "rejected" && (
                          <Button
                            onClick={() => {
                              setSelectedUserId(getUserId(user));
                              setApprovalModalOpen(true);
                            }}
                            variant={"primary"}
                            isDisabled={undefined}
                            size={"sm"}
                            className="rounded-xl"
                          >
                            승인
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div
          style={{ display: "flex", justifyContent: "center", marginTop: 8 }}
        >
          <Pagination aria-label="페이지 이동">
            <Pagination.Summary>
              {page} / {Math.max(1, totalPages)}
            </Pagination.Summary>
            <Pagination.Content>
              <Pagination.Item>
                <Pagination.Previous
                  isDisabled={page <= 1}
                  onPress={() =>
                    ((_, newPage) => setPage(newPage))(null, page - 1)
                  }
                >
                  이전
                </Pagination.Previous>
              </Pagination.Item>
              <Pagination.Item>
                <Pagination.Next
                  isDisabled={page >= totalPages}
                  onPress={() =>
                    ((_, newPage) => setPage(newPage))(null, page + 1)
                  }
                >
                  다음
                </Pagination.Next>
              </Pagination.Item>
            </Pagination.Content>
          </Pagination>
        </div>
      )}
      {/* 승인 확인 모달 */}
      <Modal.Backdrop
        isOpen={approvalModalOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen && !processing) setApprovalModalOpen(false);
        }}
        isDismissable={!processing}
        isKeyboardDismissDisabled={processing}
      >
        <Modal.Container size="md" scroll="inside">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>회원가입 승인</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <div className={"text-sm text-neutral-700"}>
                선택한 사용자의 회원가입을 승인하시겠습니까?
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button
                onClick={() => setApprovalModalOpen(false)}
                variant={"ghost"}
                isDisabled={processing}
                size={"md"}
                className="rounded-xl"
              >
                취소
              </Button>
              <Button
                onClick={handleApproval}
                variant={"primary"}
                isDisabled={processing}
                size={"md"}
                className="rounded-xl"
              >
                {processing ? (
                  <Spinner aria-label="불러오는 중" size="sm" />
                ) : (
                  "승인"
                )}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
      {/* 거부 사유 입력 모달 */}
      <Modal.Backdrop
        isOpen={rejectionModalOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen && !processing) setRejectionModalOpen(false);
        }}
        isDismissable={!processing}
        isKeyboardDismissDisabled={processing}
      >
        <Modal.Container size="md" scroll="inside">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>회원가입 거부</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <div
                style={{ marginBottom: 8 }}
                className={"text-sm text-neutral-700"}
              >
                거부 사유를 선택해주세요.
              </div>
              <div style={{ marginTop: 4 }}>
                <Label>거부 사유</Label>
                <Select
                  selectedKey={rejectionReason}
                  onSelectionChange={(value) =>
                    ((e) => {
                      setRejectionReason(e.target.value);
                      if (e.target.value !== "OTHER") {
                        setCustomRejectionReason("");
                      }
                    })({
                      target: { value },
                    } as React.ChangeEvent<HTMLSelectElement>)
                  }
                  isDisabled={undefined}
                  aria-label={"거부 사유"}
                  className="w-full"
                >
                  <Label>{"거부 사유"}</Label>
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      {rejectionReasons.map((reason, index) => (
                        <ListBox.Item
                          key={reason.value}
                          id={reason.value}
                          textValue={reason.label}
                        >
                          {reason.label}
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>
              </div>
              {rejectionReason === "OTHER" && (
                <div style={{ marginTop: 8 }}>
                  <TextField
                    className="w-full"
                    isDisabled={undefined}
                    isInvalid={undefined}
                  >
                    <Label>{"기타 거부 사유"}</Label>
                    <TextArea
                      value={customRejectionReason}
                      onChange={(e) => setCustomRejectionReason(e.target.value)}
                      placeholder="거부 사유를 직접 입력해주세요"
                      required
                      rows={3}
                      aria-label={"기타 거부 사유"}
                    />
                  </TextField>
                </div>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button
                onClick={() => setRejectionModalOpen(false)}
                variant={"ghost"}
                isDisabled={processing}
                size={"md"}
                className="rounded-xl"
              >
                취소
              </Button>
              <Button
                onClick={handleRejection}
                variant={"danger"}
                isDisabled={
                  processing ||
                  !rejectionReason.trim() ||
                  (rejectionReason === "OTHER" && !customRejectionReason.trim())
                }
                size={"md"}
                className="rounded-xl"
              >
                {processing ? (
                  <Spinner aria-label="불러오는 중" size="sm" />
                ) : (
                  "거부"
                )}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
      {/* 사용자 상세 정보 모달 */}
      {userDetail && (
        <UserDetailModal
          open={userDetailModalOpen}
          onClose={() => setUserDetailModalOpen(false)}
          userId={userDetail.id}
          userDetail={userDetail}
          loading={loadingUserDetail}
          error={userDetailError}
          onRefresh={() => fetchUserDetail(userDetail.id)}
          showApprovalActions={true}
          onApproval={() => {
            setSelectedUserId(userDetail.id);
            setApprovalModalOpen(true);
            setUserDetailModalOpen(false);
          }}
          onRejection={() => {
            setSelectedUserId(userDetail.id);
            setRejectionModalOpen(true);
            setUserDetailModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default ApprovalManagementPanel;
