"use client";
import { Button as HeroActionButton } from "@heroui/react";
import {
  Alert,
  Avatar,
  Button,
  Card,
  Chip,
  Modal,
  Pagination,
  Spinner,
  Tabs,
} from "@heroui/react";

import { ExternalLink, Instagram, LayoutGrid, List } from "lucide-react";

import { useState, useEffect, useMemo, useCallback } from "react";

import AdminService from "@/app/services/admin";
import {
  UserProfileWithAppearance,
  AppearanceGrade,
  Gender,
  isBlindApprovedUser,
  isGradeRequiredUser,
} from "@/app/admin/users/appearance/types";
import UserDetailModal, { UserDetail } from "./UserDetailModal";
import UnclassifiedUsersTable from "./UnclassifiedUsersTable";
import RegionFilter, {
  useRegionFilter,
} from "@/components/admin/common/RegionFilter";

interface UnclassifiedUsersPanelProps {
  title?: string;
  description?: string;
  initialViewMode?: "card" | "table";
}

// 등급 색상 정의
const GRADE_COLORS: Record<AppearanceGrade, string> = {
  S: "#8E44AD", // 보라색
  A: "#3498DB", // 파란색
  B: "#2ECC71", // 초록색
  C: "#F39C12", // 주황색
  UNKNOWN: "#95A5A6", // 회색
};

// 등급 한글 표시
const GRADE_LABELS: Record<AppearanceGrade, string> = {
  S: "S등급",
  A: "A등급",
  B: "B등급",
  C: "C등급",
  UNKNOWN: "미분류",
};

// 성별 한글 표시
const GENDER_LABELS: Record<Gender, string> = {
  MALE: "남성",
  FEMALE: "여성",
};

// 지역 한글 표시
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

const hasApprovalContractFields = (user: UserProfileWithAppearance) =>
  user.approvalMode !== undefined ||
  user.blindMatchingApprovedAt !== undefined ||
  user.hasApprovedPhoto !== undefined ||
  user.approvedPhotoCount !== undefined;

const isGradeRequiredCohortUser = (user: UserProfileWithAppearance) =>
  isGradeRequiredUser(user) ||
  (user.appearanceGrade === "UNKNOWN" &&
    !isBlindApprovedUser(user) &&
    !hasApprovalContractFields(user));

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const UNCLASSIFIED_FETCH_LIMIT = 100;

export default function UnclassifiedUsersPanel({
  title = "미분류 사용자",
  description = "등급이 아직 정리되지 않은 사용자를 등급 정리 대상과 블라인드 승인 대상으로 분리합니다.",
  initialViewMode = "table",
}: UnclassifiedUsersPanelProps) {
  const [users, setUsers] = useState<UserProfileWithAppearance[]>([]);
  const [activeCohort, setActiveCohort] = useState<
    "GRADE_REQUIRED" | "BLIND_APPROVED"
  >("GRADE_REQUIRED");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [viewMode, setViewMode] = useState<"card" | "table">(initialViewMode);

  // 지역 필터 훅 사용
  const { region, setRegion: setRegionFilter } = useRegionFilter();

  // 등급 설정 상태
  const [selectedUser, setSelectedUser] =
    useState<UserProfileWithAppearance | null>(null);
  const [selectedGrade, setSelectedGrade] =
    useState<AppearanceGrade>("UNKNOWN");
  const [savingGrade, setSavingGrade] = useState(false);
  const [gradeMenuAnchorEl, setGradeMenuAnchorEl] =
    useState<null | HTMLElement>(null);

  // 유저 상세 정보 모달 상태
  const [userDetailModalOpen, setUserDetailModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [loadingUserDetail, setLoadingUserDetail] = useState(false);
  const [userDetailError, setUserDetailError] = useState<string | null>(null);

  const gradeRequiredUsers = useMemo(
    () => users.filter(isGradeRequiredCohortUser),
    [users],
  );

  const blindApprovedUsers = useMemo(
    () => users.filter(isBlindApprovedUser),
    [users],
  );

  const cohortUsers =
    activeCohort === "BLIND_APPROVED" ? blindApprovedUsers : gradeRequiredUsers;
  const totalPages = Math.max(1, Math.ceil(cohortUsers.length / pageSize));
  const visibleUsers = cohortUsers.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  const totalUnknownCount = users.length;
  const gradeRequiredCount = gradeRequiredUsers.length;
  const blindApprovedCount = blindApprovedUsers.length;

  // 미분류 사용자 목록 조회
  const fetchUnclassifiedUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const regionParam = !region || region === "ALL" ? undefined : region;
      const firstPage = await AdminService.userAppearance.getUnclassifiedUsers(
        1,
        UNCLASSIFIED_FETCH_LIMIT,
        regionParam,
      );
      const meta = firstPage.meta ?? {};
      const totalPagesFromMeta = Number(meta.totalPages ?? 0);
      const totalItems = Number(
        meta.totalItems ?? meta.total ?? firstPage.data.length,
      );
      const computedTotalPages = Math.ceil(
        totalItems / UNCLASSIFIED_FETCH_LIMIT,
      );
      const pagesToFetch = Math.max(1, totalPagesFromMeta, computedTotalPages);

      if (pagesToFetch > 1) {
        const restResponses = await Promise.all(
          Array.from({ length: pagesToFetch - 1 }, (_, index) =>
            AdminService.userAppearance.getUnclassifiedUsers(
              index + 2,
              UNCLASSIFIED_FETCH_LIMIT,
              regionParam,
            ),
          ),
        );
        setUsers([
          ...firstPage.data,
          ...restResponses.flatMap((response) => response.data),
        ]);
      } else {
        setUsers(firstPage.data);
      }
    } catch (err: unknown) {
      setError(
        getErrorMessage(
          err,
          "미분류 사용자 목록을 불러오는 중 오류가 발생했습니다.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [region]);

  useEffect(() => {
    setPage(1);
    fetchUnclassifiedUsers();
  }, [fetchUnclassifiedUsers]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  // 페이지 변경 핸들러
  const handlePageChange = (
    event: React.ChangeEvent<unknown> | null,
    value: number,
  ) => {
    setPage(value);
  };

  const handleUsersRemove = (userIds: string[]) => {
    setUsers((prev) => prev.filter((u) => !userIds.includes(u.userId ?? u.id)));
  };

  // 등급 토글 메뉴 열기
  const handleOpenGradeMenu = (
    event: React.MouseEvent<Element>,
    user: UserProfileWithAppearance,
  ) => {
    setGradeMenuAnchorEl(event.currentTarget as HTMLElement);
    setSelectedUser(user);
    setSelectedGrade(user.appearanceGrade);
  };

  // 등급 토글 메뉴 닫기
  const handleCloseGradeMenu = () => {
    setGradeMenuAnchorEl(null);
  };

  // 유저 상세 정보 모달 열기
  const handleOpenUserDetailModal = async (userId: string) => {
    try {
      setSelectedUserId(userId);
      setUserDetailModalOpen(true);
      setLoadingUserDetail(true);
      setUserDetailError(null);
      setUserDetail(null);

      const data = await AdminService.userAppearance.getUserDetails(userId);

      setUserDetail(data);
    } catch (error: unknown) {
      setUserDetailError(
        getErrorMessage(
          error,
          "유저 상세 정보를 불러오는 중 오류가 발생했습니다.",
        ),
      );
    } finally {
      setLoadingUserDetail(false);
    }
  };

  // 유저 상세 정보 모달 닫기
  const handleCloseUserDetailModal = () => {
    setUserDetailModalOpen(false);
  };

  // 등급 설정 저장
  const handleSaveGrade = async (newGrade: AppearanceGrade) => {
    if (!selectedUser) {
      setError("선택된 사용자가 없습니다.");
      return;
    }

    // userId가 없는 경우 id를 사용
    const userId = selectedUser.userId ?? selectedUser.id;

    if (!userId) {
      setError("선택된 사용자의 ID가 없습니다.");
      return;
    }

    try {
      setSavingGrade(true);
      await AdminService.userAppearance.setUserAppearanceGrade(
        userId,
        newGrade,
      );

      // 목록 업데이트 (미분류에서 제거)
      if (newGrade !== "UNKNOWN") {
        setUsers((prev) =>
          prev.filter((user) => {
            const userIdToCompare = user.userId ?? user.id;
            return userIdToCompare !== userId;
          }),
        );
      } else {
        // 미분류로 다시 설정한 경우는 상태만 업데이트
        setUsers((prev) =>
          prev.map((user) => {
            const userIdToCompare = user.userId ?? user.id;
            return userIdToCompare === userId
              ? { ...user, appearanceGrade: newGrade }
              : user;
          }),
        );
      }

      handleCloseGradeMenu();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "등급 설정 중 오류가 발생했습니다."));
    } finally {
      setSavingGrade(false);
    }
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <div>
          <div className={"text-lg font-semibold text-neutral-900"}>
            {title}
          </div>
          <div className={"text-sm text-neutral-700"}>{description}</div>
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={viewMode === "card" ? "primary" : "secondary"}
              isDisabled={undefined}
              onPress={() =>
                ((_, v) => v && setViewMode(v as "card" | "table"))(
                  null,
                  "card",
                )
              }
              aria-label="카드 뷰"
            >
              <LayoutGrid />
            </Button>
            <Button
              variant={viewMode === "table" ? "primary" : "secondary"}
              isDisabled={undefined}
              onPress={() =>
                ((_, v) => v && setViewMode(v as "card" | "table"))(
                  null,
                  "table",
                )
              }
              aria-label="테이블 뷰"
            >
              <List />
            </Button>
          </div>
          <Button
            onClick={fetchUnclassifiedUsers}
            variant={"secondary"}
            isDisabled={loading}
            size={"md"}
            className="rounded-xl"
          >
            새로고침
          </Button>
        </div>
      </div>
      {/* 지역 필터 */}
      <div style={{ marginBottom: 12 }}>
        <RegionFilter
          value={region}
          onChange={setRegionFilter}
          size="small"
          sx={{ minWidth: 150 }}
        />
      </div>
      <div
        style={{ marginBottom: 12 }}
        className={"grid grid-cols-1 gap-4 md:grid-cols-2"}
      >
        <div className={"min-w-0"}>
          <Card style={{ borderColor: "#CBD5E1" }}>
            <Card.Content style={{ paddingTop: 8, paddingBottom: 8 }}>
              <div
                style={{ color: "#64748B", fontWeight: 700 }}
                className={"text-sm text-neutral-700"}
              >
                전체 등급 미분류
              </div>
              <div
                style={{ marginTop: 2, fontWeight: 800, color: "#0F172A" }}
                className={"text-lg font-semibold text-neutral-900"}
              >
                {loading ? "-" : `${totalUnknownCount.toLocaleString()}명`}
              </div>
            </Card.Content>
          </Card>
        </div>
        <div className={"min-w-0"}>
          <Card
            style={{
              borderColor: "#FDBA74",
              backgroundColor: `color-mix(in srgb, ${"#F97316"} 4%, transparent)`,
            }}
          >
            <Card.Content style={{ paddingTop: 8, paddingBottom: 8 }}>
              <div
                style={{ color: "#C2410C", fontWeight: 700 }}
                className={"text-sm text-neutral-700"}
              >
                등급 설정 후 승인 필요
              </div>
              <div
                style={{ marginTop: 2, fontWeight: 800, color: "#9A3412" }}
                className={"text-lg font-semibold text-neutral-900"}
              >
                {loading ? "-" : `${gradeRequiredCount.toLocaleString()}명`}
              </div>
            </Card.Content>
          </Card>
        </div>
        <div className={"min-w-0"}>
          <Card
            style={{
              borderColor: "#93C5FD",
              backgroundColor: `color-mix(in srgb, ${"#2563EB"} 4%, transparent)`,
            }}
          >
            <Card.Content style={{ paddingTop: 8, paddingBottom: 8 }}>
              <div
                style={{ color: "#1D4ED8", fontWeight: 700 }}
                className={"text-sm text-neutral-700"}
              >
                블라인드 승인 상태
              </div>
              <div
                style={{ marginTop: 2, fontWeight: 800, color: "#1E40AF" }}
                className={"text-lg font-semibold text-neutral-900"}
              >
                {loading ? "-" : `${blindApprovedCount.toLocaleString()}명`}
              </div>
            </Card.Content>
          </Card>
        </div>
      </div>
      <Tabs
        selectedKey={activeCohort}
        onSelectionChange={(key) =>
          ((_, value) => {
            setActiveCohort(String(value) as typeof activeCohort);
            setPage(1);
          })(null, key)
        }
      >
        <Tabs.List aria-label="목록 보기">
          <Tabs.Tab
            id={"GRADE_REQUIRED"}
          >{`등급 정리 필요 (${gradeRequiredCount})`}</Tabs.Tab>
          <Tabs.Tab
            id={"BLIND_APPROVED"}
          >{`블라인드 승인 (${blindApprovedCount})`}</Tabs.Tab>
        </Tabs.List>
      </Tabs>
      {error && (
        <Alert style={{ marginBottom: 12 }} status="danger" role="alert">
          <Alert.Content>{error}</Alert.Content>
        </Alert>
      )}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 16 }}>
          <Spinner aria-label="불러오는 중" size="sm" />
        </div>
      ) : visibleUsers.length === 0 ? (
        <Alert status={"default"} role="alert">
          <Alert.Content>
            {activeCohort === "GRADE_REQUIRED"
              ? "등급 정리 필요 사용자가 없습니다."
              : "블라인드 승인 사용자가 없습니다."}
          </Alert.Content>
        </Alert>
      ) : viewMode === "table" ? (
        <UnclassifiedUsersTable
          users={visibleUsers}
          loading={loading}
          error={error}
          cohort={activeCohort}
          totalCount={cohortUsers.length}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onRefresh={fetchUnclassifiedUsers}
          onUsersRemove={handleUsersRemove}
        />
      ) : (
        <>
          <div className={"grid grid-cols-1 gap-4 md:grid-cols-2"}>
            {visibleUsers.map((user) => {
              const approvedPhotoCount = Number(user.approvedPhotoCount ?? 0);
              const isBlindApproved = isBlindApprovedUser(user);

              return (
                <div key={user.userId} className={"min-w-0"}>
                  <Card>
                    <Card.Content>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        <HeroActionButton
                          variant="ghost"
                          className="h-auto min-w-0 p-0"
                          onClick={() => handleOpenUserDetailModal(user.id)}
                          aria-label="프로필 상세 보기"
                        >
                          <Avatar
                            style={{
                              width: 80,
                              height: 80,
                              marginBottom: 8,
                              cursor: "pointer",
                            }}
                          >
                            <Avatar.Image
                              src={
                                user.profileImageUrl ??
                                user.profileImages?.[0]?.url ??
                                ""
                              }
                              alt={user.name}
                            />
                            <Avatar.Fallback>
                              {user.name?.charAt(0) ?? "?"}
                            </Avatar.Fallback>
                          </Avatar>
                        </HeroActionButton>
                        <div
                          className={"text-lg font-semibold text-neutral-900"}
                        >
                          {user.name}
                        </div>
                        <div className={"text-sm text-neutral-700"}>
                          {user.age}세 / {GENDER_LABELS[user.gender]}
                        </div>
                        <div
                          style={{ marginBottom: 4 }}
                          className={"flex flex-wrap items-center gap-2"}
                        >
                          <Chip
                            style={{
                              backgroundColor: isBlindApproved
                                ? `color-mix(in srgb, ${"#2563EB"} 10%, transparent)`
                                : `color-mix(in srgb, ${"#D97706"} 12%, transparent)`,
                              color: isBlindApproved ? "#2563EB" : "#D97706",
                              fontWeight: 700,
                            }}
                            size={"sm"}
                            variant={"soft"}
                          >
                            {isBlindApproved ? "블라인드 승인" : "등급 필요"}
                          </Chip>
                          <Chip
                            style={{
                              backgroundColor: `color-mix(in srgb, ${"#059669"} 10%, transparent)`,
                              color: "#059669",
                              fontWeight: 700,
                            }}
                            size={"sm"}
                            variant={"soft"}
                          >{`승인 사진 ${approvedPhotoCount}장`}</Chip>
                        </div>
                        {/* 프로필 정보 입력 여부 */}
                        <Chip
                          style={{
                            backgroundColor: user.hasPreferences
                              ? "#e8f5e8"
                              : "#ffebee",
                            color: user.hasPreferences ? "#2e7d32" : "#c62828",
                            fontWeight: "medium",
                            marginBottom: 4,
                          }}
                          size={"sm"}
                          variant={"soft"}
                        >
                          {user.hasPreferences
                            ? "프로필 입력 완료"
                            : "프로필 미입력"}
                        </Chip>
                        {/* 장기 미접속자 표시 */}
                        {user.isLongTermInactive && (
                          <Chip
                            style={{
                              backgroundColor: "#fff3cd",
                              color: "#856404",
                              fontWeight: "medium",
                              marginBottom: 4,
                            }}
                            size={"sm"}
                            variant={"soft"}
                          >
                            {"장기 미접속"}
                          </Chip>
                        )}
                        <div className={"text-sm text-neutral-700"}>
                          지역: {getRegionLabel(user.region)}
                        </div>
                        {user.universityDetails?.name && (
                          <div className={"text-sm text-neutral-700"}>
                            {user.universityDetails.name}
                          </div>
                        )}
                        {user.instagramId && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              marginTop: 4,
                              marginBottom: 4,
                            }}
                          >
                            <Instagram />
                            <a
                              href={`https://instagram.com/${user.instagramId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: "flex",
                                alignItems: "center",
                                textDecoration: "none",
                                color: "#7A4AE2",
                              }}
                            >
                              {user.instagramId}
                              <ExternalLink />
                            </a>
                          </div>
                        )}
                        <div
                          style={{
                            marginTop: 8,
                            display: "flex",
                            justifyContent: "center",
                          }}
                        >
                          <HeroActionButton
                            variant="ghost"
                            className="h-auto min-w-0 p-0"
                            onClick={(e) => handleOpenGradeMenu(e, user)}
                          >
                            <Chip
                              style={{
                                backgroundColor:
                                  GRADE_COLORS[user.appearanceGrade],
                                color: "white",
                                cursor: "pointer",
                              }}
                              size={"sm"}
                              variant={"soft"}
                            >
                              {GRADE_LABELS[user.appearanceGrade]}
                            </Chip>
                          </HeroActionButton>
                        </div>
                      </div>
                    </Card.Content>
                  </Card>
                </div>
              );
            })}
          </div>

          <div
            style={{ display: "flex", justifyContent: "center", marginTop: 16 }}
          >
            <Pagination aria-label="페이지 이동">
              <Pagination.Summary>
                {page} / {Math.max(1, totalPages)}
              </Pagination.Summary>
              <Pagination.Content>
                <Pagination.Item>
                  <Pagination.Previous
                    isDisabled={page <= 1}
                    onPress={() => handlePageChange(null, page - 1)}
                  >
                    이전
                  </Pagination.Previous>
                </Pagination.Item>
                <Pagination.Item>
                  <Pagination.Next
                    isDisabled={page >= totalPages}
                    onPress={() => handlePageChange(null, page + 1)}
                  >
                    다음
                  </Pagination.Next>
                </Pagination.Item>
              </Pagination.Content>
            </Pagination>
          </div>
        </>
      )}
      {/* 등급 설정 토글 메뉴 */}
      <Modal.Backdrop
        isOpen={Boolean(gradeMenuAnchorEl)}
        onOpenChange={(isOpen) => {
          if (!isOpen) handleCloseGradeMenu?.();
        }}
        isDismissable={handleCloseGradeMenu !== undefined}
      >
        <Modal.Container size="md" scroll="inside">
          <Modal.Dialog>
            <Button
              onClick={() => handleSaveGrade("S")}
              style={{
                color: GRADE_COLORS["S"],
                fontWeight: selectedGrade === "S" ? "bold" : "normal",
                backgroundColor:
                  selectedGrade === "S"
                    ? "rgba(142, 68, 173, 0.1)"
                    : "transparent",
              }}
              variant={"ghost"}
              isDisabled={savingGrade}
              className="w-full justify-start"
            >
              S등급
            </Button>
            <Button
              onClick={() => handleSaveGrade("A")}
              style={{
                color: GRADE_COLORS["A"],
                fontWeight: selectedGrade === "A" ? "bold" : "normal",
                backgroundColor:
                  selectedGrade === "A"
                    ? "rgba(52, 152, 219, 0.1)"
                    : "transparent",
              }}
              variant={"ghost"}
              isDisabled={savingGrade}
              className="w-full justify-start"
            >
              A등급
            </Button>
            <Button
              onClick={() => handleSaveGrade("B")}
              style={{
                color: GRADE_COLORS["B"],
                fontWeight: selectedGrade === "B" ? "bold" : "normal",
                backgroundColor:
                  selectedGrade === "B"
                    ? "rgba(46, 204, 113, 0.1)"
                    : "transparent",
              }}
              variant={"ghost"}
              isDisabled={savingGrade}
              className="w-full justify-start"
            >
              B등급
            </Button>
            <Button
              onClick={() => handleSaveGrade("C")}
              style={{
                color: GRADE_COLORS["C"],
                fontWeight: selectedGrade === "C" ? "bold" : "normal",
                backgroundColor:
                  selectedGrade === "C"
                    ? "rgba(243, 156, 18, 0.1)"
                    : "transparent",
              }}
              variant={"ghost"}
              isDisabled={savingGrade}
              className="w-full justify-start"
            >
              C등급
            </Button>
            <Button
              onClick={() => handleSaveGrade("UNKNOWN")}
              style={{
                color: GRADE_COLORS["UNKNOWN"],
                fontWeight: selectedGrade === "UNKNOWN" ? "bold" : "normal",
                backgroundColor:
                  selectedGrade === "UNKNOWN"
                    ? "rgba(149, 165, 166, 0.1)"
                    : "transparent",
              }}
              variant={"ghost"}
              isDisabled={savingGrade}
              className="w-full justify-start"
            >
              미분류
            </Button>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
      {/* 유저 상세 정보 모달 */}
      {!!userDetail && (
        <UserDetailModal
          open={userDetailModalOpen}
          onClose={handleCloseUserDetailModal}
          userId={selectedUserId}
          userDetail={userDetail}
          loading={loadingUserDetail}
          error={userDetailError}
          onRefresh={() => {
            // 데이터 새로고침
            fetchUnclassifiedUsers();
          }}
        />
      )}
    </div>
  );
}
