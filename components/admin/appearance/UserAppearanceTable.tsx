"use client";
import { Label as HeroSelectLabel } from "@heroui/react";

import { Button as HeroActionButton } from "@heroui/react";
import {
  Alert,
  Avatar,
  Button,
  Checkbox,
  Chip,
  Label,
  ListBox,
  Modal,
  Pagination,
  Select,
  Spinner,
  Tooltip,
} from "@heroui/react";

import { ExternalLink, Instagram } from "lucide-react";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";

import AdminService from "@/app/services/admin";
import {
  UserProfileWithAppearance,
  AppearanceGrade,
  Gender,
  UserStatus,
} from "@/app/admin/users/appearance/types";
import {
  formatDateWithoutTimezoneConversion,
  formatDateTimeWithoutTimezoneConversion,
} from "@/app/utils/formatters";
import { appearanceGradeEventBus } from "@/app/admin/users/appearance/event-bus";
import { sanitizeUrl } from "@/shared/lib/safe-url";
import { useToast } from "@/shared/ui/admin/toast";
import UserDetailModal, { UserDetail } from "./UserDetailModal";
import BulkEmailNotificationModal from "./modals/BulkEmailNotificationModal";

const GRADE_COLORS: Record<AppearanceGrade, string> = {
  S: "#7C3AED",
  A: "#2563EB",
  B: "#059669",
  C: "#D97706",
  UNKNOWN: "#94A3B8",
};

const GRADE_LABELS: Record<AppearanceGrade, string> = {
  S: "S",
  A: "A",
  B: "B",
  C: "C",
  UNKNOWN: "미분류",
};

const GENDER_LABELS: Record<Gender, string> = {
  MALE: "남",
  FEMALE: "여",
};

type AppearanceUserSort = "newest" | "lastActive";

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

const headerCellSx = {
  whiteSpace: "nowrap",
  fontWeight: 600,
  fontSize: "0.8125rem",
  color: "#475569",
  bgcolor: "#F8FAFC",
  borderBottom: "2px solid #E2E8F0",
  py: 1.5,
  px: 1.5,
} as const;

const bodyCellSx = {
  whiteSpace: "nowrap",
  py: 1.25,
  px: 1.5,
  fontSize: "0.8125rem",
  borderBottom: "1px solid #F1F5F9",
} as const;

interface UserAppearanceTableProps {
  initialFilters?: {
    gender?: Gender;
    appearanceGrade?: AppearanceGrade;
    universityName?: string;
    minAge?: number;
    maxAge?: number;
    searchTerm?: string;
    region?: string;
    isLongTermInactive?: boolean;
    hasPreferences?: boolean;
    includeDeleted?: boolean;
  };
  userStatus?: UserStatus;
}

interface UserAppearanceTableRef {
  handleApplyFilter: (filters: any) => void;
}

const UserAppearanceTable = forwardRef<
  UserAppearanceTableRef,
  UserAppearanceTableProps
>(({ initialFilters, userStatus }, ref) => {
  const toast = useToast();
  const [users, setUsers] = useState<UserProfileWithAppearance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState(initialFilters || {});
  const [sort, setSort] = useState<AppearanceUserSort>("newest");

  const [selectedUser, setSelectedUser] =
    useState<UserProfileWithAppearance | null>(null);
  const [selectedGrade, setSelectedGrade] =
    useState<AppearanceGrade>("UNKNOWN");
  const [savingGrade, setSavingGrade] = useState(false);
  const [gradeMenuAnchorEl, setGradeMenuAnchorEl] =
    useState<null | HTMLElement>(null);

  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [bulkEditModalOpen, setBulkEditModalOpen] = useState(false);
  const [bulkSelectedGrade, setBulkSelectedGrade] =
    useState<AppearanceGrade>("UNKNOWN");
  const [savingBulkGrade, setSavingBulkGrade] = useState(false);

  const [bulkEmailModalOpen, setBulkEmailModalOpen] = useState(false);

  const [userDetailModalOpen, setUserDetailModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [loadingUserDetail, setLoadingUserDetail] = useState(false);
  const [userDetailError, setUserDetailError] = useState<string | null>(null);

  const [universityApprovalDialogOpen, setUniversityApprovalDialogOpen] =
    useState(false);
  const [userToApprove, setUserToApprove] =
    useState<UserProfileWithAppearance | null>(null);
  const [approvingUniversity, setApprovingUniversity] = useState(false);

  // 모달 뒤 페이지에만 보이던 오류를 토스트로도 알린다
  const reportError = (message: string) => {
    setError(message);
    toast.error(message);
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response =
        await AdminService.userAppearance.getUsersWithAppearanceGrade({
          page: page + 1,
          limit: rowsPerPage,
          sort,
          ...filters,
          ...(userStatus && { userStatus }),
        });
      setUsers(response.data);
      setTotalItems(response.meta?.total ?? 0);
    } catch (err: any) {
      setError(err.message || "사용자 목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, rowsPerPage, filters, sort, userStatus]);

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleApplyFilter = (newFilters: any) => {
    setFilters(newFilters);
    setPage(0);
  };

  useImperativeHandle(ref, () => ({
    handleApplyFilter: (newFilters: any) => handleApplyFilter(newFilters),
  }));

  const handleOpenGradeMenu = (
    event: React.MouseEvent<Element>,
    user: UserProfileWithAppearance,
  ) => {
    setGradeMenuAnchorEl(event.currentTarget as HTMLElement);
    setSelectedUser(user);
    setSelectedGrade(user.appearanceGrade);
  };

  const handleCloseGradeMenu = () => {
    setGradeMenuAnchorEl(null);
  };

  const handleUniversityVerificationApproval = (userId: string) => {
    const user = users.find((u) => (u.userId || u.id) === userId);
    if (user) {
      setUserToApprove(user);
      setUniversityApprovalDialogOpen(true);
    }
  };

  const handleConfirmUniversityApproval = async () => {
    if (!userToApprove) return;
    try {
      setApprovingUniversity(true);
      await AdminService.userAppearance.approveUniversityVerification(
        userToApprove.userId || userToApprove.id,
      );
      setUsers((prev) =>
        prev.map((user) =>
          (user.userId || user.id) ===
          (userToApprove.userId || userToApprove.id)
            ? { ...user, isUniversityVerified: true }
            : user,
        ),
      );
      setUniversityApprovalDialogOpen(false);
      setUserToApprove(null);
    } catch (error: any) {
      reportError(error.message || "대학교 인증 승인 중 오류가 발생했습니다.");
    } finally {
      setApprovingUniversity(false);
    }
  };

  const handleSaveGrade = async (newGrade: AppearanceGrade) => {
    if (!selectedUser) return;
    const userId = selectedUser.userId || selectedUser.id;
    if (!userId) return;

    try {
      setSavingGrade(true);
      await AdminService.userAppearance.setUserAppearanceGrade(
        userId,
        newGrade,
      );
      setUsers((prev) =>
        prev.map((user) =>
          (user.userId || user.id) === userId
            ? { ...user, appearanceGrade: newGrade }
            : user,
        ),
      );
      appearanceGradeEventBus.publish();
      handleCloseGradeMenu();
    } catch (err: any) {
      reportError(err.message || "등급 설정 중 오류가 발생했습니다.");
    } finally {
      setSavingGrade(false);
    }
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleSelectAllUsers = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(
        users.map((user) => user.userId || user.id).filter(Boolean) as string[],
      );
    }
  };

  const handleOpenBulkEditModal = () => {
    if (selectedUsers.length === 0) return;
    setBulkSelectedGrade("UNKNOWN");
    setBulkEditModalOpen(true);
  };

  const handleOpenBulkEmailModal = () => {
    if (selectedUsers.length === 0) return;
    setBulkEmailModalOpen(true);
  };

  const handleOpenUserDetailModal = async (userId: string) => {
    try {
      setSelectedUserId(userId);
      setUserDetailModalOpen(true);
      setLoadingUserDetail(true);
      setUserDetailError(null);
      setUserDetail(null);
      const data = await AdminService.userAppearance.getUserDetails(userId);
      setUserDetail(data);
    } catch (error: any) {
      setUserDetailError(
        error.message || "유저 상세 정보를 불러오는 중 오류가 발생했습니다.",
      );
    } finally {
      setLoadingUserDetail(false);
    }
  };

  const handleSaveBulkGrade = async () => {
    if (selectedUsers.length === 0) return;
    try {
      setSavingBulkGrade(true);
      await AdminService.userAppearance.bulkSetUserAppearanceGrade(
        selectedUsers,
        bulkSelectedGrade,
      );
      setUsers((prev) =>
        prev.map((user) =>
          selectedUsers.includes(user.userId || user.id)
            ? { ...user, appearanceGrade: bulkSelectedGrade }
            : user,
        ),
      );
      appearanceGradeEventBus.publish();
      setSelectedUsers([]);
      setBulkEditModalOpen(false);
    } catch (err: any) {
      reportError(err.message || "일괄 등급 설정 중 오류가 발생했습니다.");
    } finally {
      setSavingBulkGrade(false);
    }
  };

  const getUserId = (user: UserProfileWithAppearance) => user.userId || user.id;

  const getUniversityName = (user: UserProfileWithAppearance): string => {
    if (user.university) {
      return typeof user.university === "string"
        ? user.university
        : user.university.name;
    }
    if (user.universityDetails) return user.universityDetails.name;
    if (user.universityName) return user.universityName;
    return "-";
  };

  const getInstagramId = (user: UserProfileWithAppearance): string | null => {
    if (
      !user.instagramId ||
      user.instagramId === "undefined" ||
      user.instagramId === "null"
    ) {
      return null;
    }
    return user.instagramId;
  };

  return (
    <div>
      {error && (
        <Alert
          style={{ marginBottom: 8, borderRadius: 8 }}
          status="danger"
          role="alert"
        >
          <Alert.Content>{error}</Alert.Content>
        </Alert>
      )}
      {/* 일괄 작업 바 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
          paddingLeft: 4,
          paddingRight: 4,
        }}
      >
        <div
          style={{ color: "#64748B" }}
          className={"text-sm text-neutral-700"}
        >
          {selectedUsers.length > 0 ? (
            <span>
              <strong style={{ color: "#1E293B" }}>
                {selectedUsers.length}명
              </strong>{" "}
              선택됨
            </span>
          ) : (
            "사용자를 선택하여 일괄 작업 수행"
          )}
        </div>
        <div className={"flex flex-wrap items-center gap-2"}>
          <Button
            onClick={handleOpenBulkEditModal}
            style={{ borderRadius: 8, textTransform: "none", fontWeight: 500 }}
            variant={"secondary"}
            isDisabled={selectedUsers.length === 0}
            size={"sm"}
            className="rounded-xl"
          >
            일괄 등급 설정
          </Button>
          <Button
            onClick={handleOpenBulkEmailModal}
            style={{ borderRadius: 8, textTransform: "none", fontWeight: 500 }}
            variant={"secondary"}
            isDisabled={selectedUsers.length === 0}
            size={"sm"}
            className="rounded-xl"
          >
            일괄 이메일 발송
          </Button>
        </div>
      </div>
      <div
        style={{
          minWidth: 180,
          marginBottom: 6,
          paddingLeft: 4,
          paddingRight: 4,
        }}
      >
        <Select
          selectedKey={sort}
          onSelectionChange={(value) =>
            ((event) => {
              setSort(event.target.value as AppearanceUserSort);
              setPage(0);
            })({ target: { value } } as React.ChangeEvent<HTMLSelectElement>)
          }
          isDisabled={undefined}
          aria-label={"정렬 기준"}
          className="w-full"
        >
          <Label>{"정렬 기준"}</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              <ListBox.Item
                key={"newest"}
                id={"newest"}
                textValue={"가입일 최신순"}
              >
                가입일 최신순
              </ListBox.Item>
              <ListBox.Item
                key={"lastActive"}
                id={"lastActive"}
                textValue={"최근 접속순"}
              >
                최근 접속순
              </ListBox.Item>
            </ListBox>
          </Select.Popover>
        </Select>
      </div>
      <div
        style={{
          borderRadius: 8,
          border: "1px solid #E2E8F0",
          overflowX: "auto",
        }}
        className={"overflow-x-auto"}
      >
        <table
          style={{ minWidth: 1200 }}
          className={
            "w-full text-sm text-left [&_td]:p-3 [&_thead]:bg-neutral-50 [&_tr]:border-b"
          }
        >
          <thead>
            <tr>
              <th style={{ ...headerCellSx, paddingLeft: 8 }}>
                <Checkbox
                  isSelected={
                    users.length > 0 && selectedUsers.length === users.length
                  }
                  isDisabled={undefined}
                  isIndeterminate={
                    selectedUsers.length > 0 &&
                    selectedUsers.length < users.length
                  }
                  onChange={(isSelected) => handleSelectAllUsers()}
                  aria-label={"선택"}
                >
                  <Checkbox.Content>
                    <Checkbox.Control>
                      <Checkbox.Indicator />
                    </Checkbox.Control>
                  </Checkbox.Content>
                </Checkbox>
              </th>
              <th style={{ ...headerCellSx, minWidth: 200 }}>사용자</th>
              <th style={{ ...headerCellSx, minWidth: 80 }}>나이</th>
              <th style={headerCellSx}>전화번호</th>
              <th style={headerCellSx}>대학교</th>
              <th style={{ ...headerCellSx, textAlign: "center" }}>인증</th>
              <th style={{ ...headerCellSx, textAlign: "center" }}>등급</th>
              <th style={{ ...headerCellSx, textAlign: "center" }}>상태</th>
              <th style={headerCellSx}>인스타그램</th>
              <th style={headerCellSx}>가입일</th>
              <th style={headerCellSx}>최근 접속</th>
              <th style={headerCellSx}>최근 알림</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={12} style={{ paddingTop: 24, paddingBottom: 24 }}>
                  <Spinner aria-label="불러오는 중" size="sm" />
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={12} style={{ paddingTop: 24, paddingBottom: 24 }}>
                  <div className={"text-sm text-neutral-700"}>
                    조회된 사용자가 없습니다.
                  </div>
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const userId = getUserId(user);
                const instagramId = getInstagramId(user);

                return (
                  <tr
                    key={userId}
                    style={{
                      backgroundColor:
                        user.statusAt === "instagramerror"
                          ? "rgba(239, 68, 68, 0.04)"
                          : user.isLongTermInactive
                            ? "rgba(245, 158, 11, 0.04)"
                            : "inherit",
                      transition: "background-color 0.15s",
                    }}
                  >
                    {/* 체크박스 */}
                    <td style={{ ...bodyCellSx, paddingLeft: 8 }}>
                      <Checkbox
                        isSelected={selectedUsers.includes(userId)}
                        isDisabled={undefined}
                        isIndeterminate={undefined}
                        onChange={(isSelected) => handleSelectUser(userId)}
                        aria-label={"선택"}
                      >
                        <Checkbox.Content>
                          <Checkbox.Control>
                            <Checkbox.Indicator />
                          </Checkbox.Control>
                        </Checkbox.Content>
                      </Checkbox>
                    </td>
                    {/* 사용자 (프로필 + 이름 + 이메일 통합) */}
                    <td style={bodyCellSx}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <HeroActionButton
                          variant="ghost"
                          className="h-auto min-w-0 p-0"
                          onClick={() => handleOpenUserDetailModal(userId)}
                          aria-label="프로필 상세 보기"
                        >
                          <Avatar
                            style={{
                              width: 36,
                              height: 36,
                              cursor: "pointer",
                              fontSize: "0.875rem",
                              transition: "box-shadow 0.15s",
                            }}
                          >
                            <Avatar.Image
                              src={
                                user.profileImageUrl ||
                                user.profileImages?.[0]?.url ||
                                ""
                              }
                              alt={user.name}
                            />
                            <Avatar.Fallback>
                              {user.name?.charAt(0) || "?"}
                            </Avatar.Fallback>
                          </Avatar>
                        </HeroActionButton>
                        <div style={{ minWidth: 0 }}>
                          <HeroActionButton
                            variant="ghost"
                            style={{
                              fontWeight: 600,
                              color: "#1E293B",
                              cursor: "pointer",
                            }}
                            className={"text-sm text-neutral-700"}
                            onClick={() => handleOpenUserDetailModal(userId)}
                          >
                            {user.name}
                          </HeroActionButton>
                          {user.email && (
                            <div
                              style={{ color: "#94A3B8", display: "block" }}
                              className={"text-sm text-neutral-700"}
                            >
                              {user.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    {/* 나이/성별 */}
                    <td style={bodyCellSx}>
                      <div
                        style={{ color: "#334155" }}
                        className={"text-sm text-neutral-700"}
                      >
                        {user.age}
                        <div
                          style={{ color: "#94A3B8", marginLeft: 2 }}
                          className={"text-sm text-neutral-700"}
                        >
                          {GENDER_LABELS[user.gender]}
                        </div>
                      </div>
                    </td>
                    {/* 전화번호 */}
                    <td style={bodyCellSx}>
                      <div
                        style={{ color: "#334155" }}
                        className={"text-sm text-neutral-700"}
                      >
                        {user.phoneNumber || "-"}
                      </div>
                    </td>
                    {/* 대학교 + 지역 통합 */}
                    <td style={bodyCellSx}>
                      <div
                        style={{ color: "#334155" }}
                        className={"text-sm text-neutral-700"}
                      >
                        {getUniversityName(user)}
                      </div>
                      {user.region && (
                        <div
                          style={{ color: "#94A3B8" }}
                          className={"text-sm text-neutral-700"}
                        >
                          {getRegionLabel(user.region)}
                        </div>
                      )}
                    </td>
                    {/* 대학교 인증 */}
                    <td style={{ ...bodyCellSx, textAlign: "center" }}>
                      {user.isUniversityVerified ? (
                        <Chip
                          style={{
                            height: 24,
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            backgroundColor: `color-mix(in srgb, ${"#059669"} 10%, transparent)`,
                            color: "#059669",
                          }}
                          size={"sm"}
                          variant={"soft"}
                        >
                          {"인증"}
                        </Chip>
                      ) : (
                        <Tooltip>
                            <HeroActionButton
                              aria-label="대학교 인증 승인"
                              variant="ghost"
                              className="h-auto min-w-0 p-0"
                              onClick={() =>
                                handleUniversityVerificationApproval(userId)
                              }
                            >
                              <Chip
                                style={{
                                  height: 24,
                                  fontSize: "0.75rem",
                                  fontWeight: 500,
                                  backgroundColor: `color-mix(in srgb, ${"#D97706"} 10%, transparent)`,
                                  color: "#D97706",
                                  cursor: "pointer",
                                }}
                                size={"sm"}
                                variant={"soft"}
                              >
                                {"미인증"}
                              </Chip>
                            </HeroActionButton>
                          <Tooltip.Content>
                            {"클릭하여 인증 처리"}
                          </Tooltip.Content>
                        </Tooltip>
                      )}
                    </td>
                    {/* 외모 등급 */}
                    <td style={{ ...bodyCellSx, textAlign: "center" }}>
                      <HeroActionButton
                        variant="ghost"
                        className="h-auto min-w-0 p-0"
                        onClick={(e) => handleOpenGradeMenu(e, user)}
                      >
                        <Chip
                          style={{
                            height: 24,
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            backgroundColor: `color-mix(in srgb, ${GRADE_COLORS[user.appearanceGrade]} 12%, transparent)`,
                            color: GRADE_COLORS[user.appearanceGrade],
                            cursor: "pointer",
                            border: `1px solid ${`color-mix(in srgb, ${GRADE_COLORS[user.appearanceGrade]} 30%, transparent)`}`,
                          }}
                          size={"sm"}
                          variant={"soft"}
                        >
                          {GRADE_LABELS[user.appearanceGrade]}
                        </Chip>
                      </HeroActionButton>
                    </td>
                    {/* 상태 (휴먼 + 프로필정보 통합) */}
                    <td style={{ ...bodyCellSx, textAlign: "center" }}>
                      <div className={"flex flex-wrap items-center gap-2"}>
                        {user.isLongTermInactive && (
                          <Chip
                            style={{
                              height: 22,
                              fontSize: "0.6875rem",
                              backgroundColor: `color-mix(in srgb, ${"#EF4444"} 10%, transparent)`,
                              color: "#EF4444",
                            }}
                            size={"sm"}
                            variant={"soft"}
                          >
                            {"휴먼"}
                          </Chip>
                        )}
                        {!user.hasPreferences && (
                          <Chip
                            style={{
                              height: 22,
                              fontSize: "0.6875rem",
                              backgroundColor: `color-mix(in srgb, ${"#94A3B8"} 10%, transparent)`,
                              color: "#64748B",
                            }}
                            size={"sm"}
                            variant={"soft"}
                          >
                            {"미입력"}
                          </Chip>
                        )}
                        {!user.isLongTermInactive && user.hasPreferences && (
                          <div
                            style={{ color: "#94A3B8" }}
                            className={"text-sm text-neutral-700"}
                          >
                            정상
                          </div>
                        )}
                      </div>
                    </td>
                    {/* 인스타그램 */}
                    <td style={bodyCellSx}>
                      {instagramId ? (
                        <a
                          href={
                            sanitizeUrl(user.instagramUrl, {
                              allowRelative: false,
                            }) ?? `https://instagram.com/${instagramId}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 2,
                            textDecoration: "none",
                            color: "#334155",
                            fontSize: "0.8125rem",
                          }}
                        >
                          <Instagram />
                          {instagramId}
                          {user.statusAt === "instagramerror" && (
                            <Chip
                              style={{
                                height: 18,
                                fontSize: "0.625rem",
                                marginLeft: 2,
                                backgroundColor: `color-mix(in srgb, ${"#EF4444"} 10%, transparent)`,
                                color: "#EF4444",
                              }}
                              size={"sm"}
                              variant={"soft"}
                            >
                              {"오류"}
                            </Chip>
                          )}
                        </a>
                      ) : (
                        <div
                          style={{ color: "#CBD5E1" }}
                          className={"text-sm text-neutral-700"}
                        >
                          -
                        </div>
                      )}
                    </td>
                    {/* 가입일 */}
                    <td style={bodyCellSx}>
                      <div
                        style={{ color: "#64748B" }}
                        className={"text-sm text-neutral-700"}
                      >
                        {formatDateWithoutTimezoneConversion(user.createdAt)}
                      </div>
                    </td>
                    {/* 최근 접속 */}
                    <td style={bodyCellSx}>
                      <div
                        style={{ color: "#64748B" }}
                        className={"text-sm text-neutral-700"}
                      >
                        {user.lastActiveAt
                          ? formatDateTimeWithoutTimezoneConversion(
                              user.lastActiveAt,
                            )
                          : "-"}
                      </div>
                    </td>
                    {/* 최근 알림 */}
                    <td style={bodyCellSx}>
                      <div
                        style={{ color: "#64748B" }}
                        className={"text-sm text-neutral-700"}
                      >
                        {(user as any).lastPushNotificationAt
                          ? formatDateTimeWithoutTimezoneConversion(
                              (user as any).lastPushNotificationAt,
                            )
                          : "-"}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <Pagination aria-label="페이지 이동">
        <Pagination.Summary>
          {page + 1} / {Math.max(1, Math.ceil(totalItems / rowsPerPage))}
        </Pagination.Summary>
        <Pagination.Content>
          <Pagination.Item>
            <Pagination.Previous
              isDisabled={page <= 0}
              onPress={() => handleChangePage(null, page - 1)}
            >
              이전
            </Pagination.Previous>
          </Pagination.Item>
          <Pagination.Item>
            <Pagination.Next
              isDisabled={page + 1 >= Math.ceil(totalItems / rowsPerPage)}
              onPress={() => handleChangePage(null, page + 1)}
            >
              다음
            </Pagination.Next>
          </Pagination.Item>
        </Pagination.Content>
        <div className="flex items-center gap-2">
          <Select
            aria-label="행 수"
            selectedKey={String(rowsPerPage ?? "")}
            isDisabled={undefined}
            onSelectionChange={(key) =>
              handleChangeRowsPerPage({
                target: { value: String(key ?? "") },
              } as React.ChangeEvent<HTMLSelectElement>)
            }
          >
            <HeroSelectLabel>행 수 </HeroSelectLabel>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {[10, 25, 50].map((size) => (
                  <ListBox.Item
                    key={size}
                    id={String(size)}
                    textValue={String(size)}
                  >
                    {size}
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
        </div>
      </Pagination>
      {/* 등급 설정 메뉴 */}
      <Modal.Backdrop
        isOpen={Boolean(gradeMenuAnchorEl)}
        onOpenChange={(isOpen) => {
          if (!isOpen && !savingGrade) handleCloseGradeMenu();
        }}
        isDismissable={!savingGrade}
        isKeyboardDismissDisabled={savingGrade}
      >
        <Modal.Container size="md" scroll="inside">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>
                {selectedUser?.name ?? "사용자"} 등급 변경
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body>
            {(["S", "A", "B", "C", "UNKNOWN"] as AppearanceGrade[]).map(
              (grade) => (
                <Button
                  key={grade}
                  onClick={() => handleSaveGrade(grade)}
                  style={{
                    paddingTop: 4,
                    paddingBottom: 4,
                    fontSize: "0.875rem",
                    fontWeight: selectedGrade === grade ? 700 : 400,
                    color: GRADE_COLORS[grade],
                  }}
                  variant={"ghost"}
                  isDisabled={savingGrade}
                  className="w-full justify-start"
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: GRADE_COLORS[grade],
                      marginRight: 6,
                    }}
                  ></div>
                  {GRADE_LABELS[grade]}등급
                </Button>
              ),
            )}
            </Modal.Body>
            <Modal.Footer>
              <Button
                onClick={handleCloseGradeMenu}
                variant={"ghost"}
                isDisabled={savingGrade}
              >
                닫기
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
      {/* 일괄 등급 설정 모달 */}
      <Modal.Backdrop
        isOpen={bulkEditModalOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen && !savingBulkGrade) setBulkEditModalOpen(false);
        }}
        isDismissable={!savingBulkGrade}
        isKeyboardDismissDisabled={savingBulkGrade}
      >
        <Modal.Container size="md" scroll="inside">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>일괄 외모 등급 설정</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <div style={{ minWidth: 300, paddingTop: 4 }}>
                <div
                  style={{ marginBottom: 8, color: "#64748B" }}
                  className={"text-sm text-neutral-700"}
                >
                  선택한 <strong>{selectedUsers.length}명</strong>에게 적용할
                  등급을 선택하세요.
                </div>
                <div style={{ marginTop: 4 }}>
                  <Label>외모 등급</Label>
                  <Select
                    selectedKey={bulkSelectedGrade}
                    onSelectionChange={(value) =>
                      ((e) =>
                        setBulkSelectedGrade(
                          e.target.value as AppearanceGrade,
                        ))({
                        target: { value },
                      } as React.ChangeEvent<HTMLSelectElement>)
                    }
                    isDisabled={undefined}
                    aria-label={"외모 등급"}
                    className="w-full"
                  >
                    <Label>{"외모 등급"}</Label>
                    <Select.Trigger>
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        {(
                          ["S", "A", "B", "C", "UNKNOWN"] as AppearanceGrade[]
                        ).map((grade) => (
                          <ListBox.Item
                            key={grade}
                            id={grade}
                            textValue={`${GRADE_LABELS[grade]}등급`}
                          >
                            {GRADE_LABELS[grade]}등급
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button
                onClick={() => setBulkEditModalOpen(false)}
                variant={"ghost"}
                isDisabled={savingBulkGrade}
                size={"md"}
                className="rounded-xl"
              >
                취소
              </Button>
              <Button
                onClick={handleSaveBulkGrade}
                variant={"primary"}
                isDisabled={savingBulkGrade}
                size={"md"}
                className="rounded-xl"
              >
                {savingBulkGrade ? (
                  <Spinner aria-label="불러오는 중" size="sm" />
                ) : (
                  "일괄 적용"
                )}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
      {/* 일괄 이메일 발송 모달 */}
      <BulkEmailNotificationModal
        open={bulkEmailModalOpen}
        onClose={() => setBulkEmailModalOpen(false)}
        userIds={selectedUsers}
        onSuccess={() => {
          fetchUsers();
          setSelectedUsers([]);
        }}
      />
      {/* 유저 상세 정보 모달 */}
      {!!userDetail && (
        <UserDetailModal
          open={userDetailModalOpen}
          onClose={() => setUserDetailModalOpen(false)}
          userId={selectedUserId}
          userDetail={userDetail}
          loading={loadingUserDetail}
          error={userDetailError}
          onRefresh={fetchUsers}
        />
      )}
      {/* 대학교 인증 승인 다이얼로그 */}
      <Modal.Backdrop
        isOpen={universityApprovalDialogOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen && !approvingUniversity) {
            setUniversityApprovalDialogOpen(false);
            setUserToApprove(null);
          }
        }}
        isDismissable={!approvingUniversity}
        isKeyboardDismissDisabled={approvingUniversity}
      >
        <Modal.Container size="md" scroll="inside">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>대학교 인증 승인</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <div
                style={{ marginBottom: 8 }}
                className={"text-sm text-neutral-700"}
              >
                <strong>{userToApprove?.name}</strong>님의 대학교 인증을
                승인하시겠습니까?
              </div>
              {userToApprove && (
                <div
                  style={{
                    backgroundColor: "#F8FAFC",
                    padding: 8,
                    borderRadius: 8,
                  }}
                >
                  <div className={"text-sm text-neutral-700"}>
                    이름: {userToApprove.name}
                  </div>
                  <div className={"text-sm text-neutral-700"}>
                    대학교: {getUniversityName(userToApprove)}
                  </div>
                  <div className={"text-sm text-neutral-700"}>
                    전화번호: {userToApprove.phoneNumber || "-"}
                  </div>
                </div>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button
                onClick={() => {
                  setUniversityApprovalDialogOpen(false);
                  setUserToApprove(null);
                }}
                variant={"ghost"}
                isDisabled={approvingUniversity}
                size={"md"}
                className="rounded-xl"
              >
                취소
              </Button>
              <Button
                onClick={handleConfirmUniversityApproval}
                variant={"primary"}
                isDisabled={approvingUniversity}
                size={"md"}
                className="rounded-xl"
              >
                {approvingUniversity ? (
                  <Spinner aria-label="불러오는 중" size="sm" />
                ) : null}
                {approvingUniversity ? "승인 중..." : "승인"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </div>
  );
});
UserAppearanceTable.displayName = "UserAppearanceTable";

export default UserAppearanceTable;
