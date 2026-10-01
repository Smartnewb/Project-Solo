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
  ProgressBar,
  Select,
  Spinner,
} from "@heroui/react";
import { ExternalLink, Instagram } from "lucide-react";
import { useState } from "react";

import AdminService from "@/app/services/admin";
import {
  UserProfileWithAppearance,
  AppearanceGrade,
  Gender,
  isBlindApprovedUser,
} from "@/app/admin/users/appearance/types";
import { appearanceGradeEventBus } from "@/app/admin/users/appearance/event-bus";
import UserDetailModal, { UserDetail } from "./UserDetailModal";

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

interface UnclassifiedUsersTableProps {
  users: UserProfileWithAppearance[];
  loading: boolean;
  error: string | null;
  cohort: "GRADE_REQUIRED" | "BLIND_APPROVED";
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
  onUsersRemove: (userIds: string[]) => void;
}

interface ApproveResult {
  userId: string;
  success: boolean;
  error?: string;
}

export default function UnclassifiedUsersTable({
  users,
  loading,
  error,
  cohort,
  totalCount,
  page,
  pageSize,
  onPageChange,
  onRefresh,
  onUsersRemove,
}: UnclassifiedUsersTableProps) {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const [gradeMenuAnchorEl, setGradeMenuAnchorEl] =
    useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] =
    useState<UserProfileWithAppearance | null>(null);
  const [savingGrade, setSavingGrade] = useState(false);

  const [bulkGradeModalOpen, setBulkGradeModalOpen] = useState(false);
  const [bulkSelectedGrade, setBulkSelectedGrade] =
    useState<AppearanceGrade>("UNKNOWN");
  const [savingBulkGrade, setSavingBulkGrade] = useState(false);

  const [bulkApproveModalOpen, setBulkApproveModalOpen] = useState(false);
  const [approving, setApproving] = useState(false);
  const [approveProgress, setApproveProgress] = useState(0);
  const [approveCurrent, setApproveCurrent] = useState(0);
  const [approveTotal, setApproveTotal] = useState(0);
  const [approveResults, setApproveResults] = useState<ApproveResult[]>([]);
  const [approveCompleted, setApproveCompleted] = useState(false);

  const [combinedWorkflowModalOpen, setCombinedWorkflowModalOpen] =
    useState(false);
  const [combinedGrade, setCombinedGrade] =
    useState<AppearanceGrade>("UNKNOWN");
  const [combinedPhase, setCombinedPhase] = useState<
    "select" | "grading" | "approving" | "done"
  >("select");
  const [combinedPhaseError, setCombinedPhaseError] = useState<string | null>(
    null,
  );
  const [combinedApproveProgress, setCombinedApproveProgress] = useState(0);
  const [combinedApproveCurrent, setCombinedApproveCurrent] = useState(0);
  const [combinedApproveTotal, setCombinedApproveTotal] = useState(0);
  const [combinedApproveResults, setCombinedApproveResults] = useState<
    ApproveResult[]
  >([]);

  const [userDetailModalOpen, setUserDetailModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [loadingUserDetail, setLoadingUserDetail] = useState(false);
  const [userDetailError, setUserDetailError] = useState<string | null>(null);

  const [localError, setLocalError] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const isGradeRequiredCohort = cohort === "GRADE_REQUIRED";

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

  const getErrorMessage = (error: unknown, fallback: string) =>
    error instanceof Error ? error.message : fallback;

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
      setSelectedUsers(users.map((u) => getUserId(u)).filter(Boolean));
    }
  };

  const handleOpenGradeMenu = (
    event: React.MouseEvent<Element>,
    user: UserProfileWithAppearance,
  ) => {
    setGradeMenuAnchorEl(event.currentTarget as HTMLElement);
    setSelectedUser(user);
  };

  const handleCloseGradeMenu = () => {
    setGradeMenuAnchorEl(null);
  };

  const handleSaveGrade = async (newGrade: AppearanceGrade) => {
    if (!selectedUser) return;
    const userId = getUserId(selectedUser);
    if (!userId) return;

    try {
      setSavingGrade(true);
      await AdminService.userAppearance.setUserAppearanceGrade(
        userId,
        newGrade,
      );
      appearanceGradeEventBus.publish();

      if (newGrade !== "UNKNOWN") {
        onUsersRemove([userId]);
      } else {
        onRefresh();
      }
      handleCloseGradeMenu();
    } catch (err: unknown) {
      setLocalError(getErrorMessage(err, "등급 설정 중 오류가 발생했습니다."));
    } finally {
      setSavingGrade(false);
    }
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
    } catch (err: unknown) {
      setUserDetailError(
        getErrorMessage(
          err,
          "유저 상세 정보를 불러오는 중 오류가 발생했습니다.",
        ),
      );
    } finally {
      setLoadingUserDetail(false);
    }
  };

  const handleCloseUserDetailModal = () => {
    setUserDetailModalOpen(false);
  };

  const handleSaveBulkGrade = async () => {
    if (selectedUsers.length === 0) return;
    try {
      setSavingBulkGrade(true);
      await AdminService.userAppearance.bulkSetUserAppearanceGrade(
        selectedUsers,
        bulkSelectedGrade,
      );
      appearanceGradeEventBus.publish();

      if (bulkSelectedGrade !== "UNKNOWN") {
        onUsersRemove(selectedUsers);
      } else {
        onRefresh();
      }
      setSelectedUsers([]);
      setBulkGradeModalOpen(false);
    } catch (err: unknown) {
      setLocalError(
        getErrorMessage(err, "일괄 등급 설정 중 오류가 발생했습니다."),
      );
    } finally {
      setSavingBulkGrade(false);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedUsers.length === 0) return;
    try {
      setApproving(true);
      setApproveProgress(0);
      setApproveCurrent(0);
      setApproveTotal(selectedUsers.length);
      setApproveResults([]);
      setApproveCompleted(false);

      const results = await AdminService.userReview.bulkApproveUsers(
        selectedUsers,
        (current, total) => {
          setApproveCurrent(current);
          setApproveProgress(Math.round((current / total) * 100));
        },
      );

      setApproveResults(results);
      setApproveCompleted(true);

      const succeededIds = results
        .filter((r) => r.success)
        .map((r) => r.userId);
      if (succeededIds.length > 0) {
        onUsersRemove(succeededIds);
      }
      onRefresh();
    } catch (err: unknown) {
      setLocalError(getErrorMessage(err, "일괄 승인 중 오류가 발생했습니다."));
    } finally {
      setApproving(false);
    }
  };

  const handleCombinedWorkflow = async () => {
    if (selectedUsers.length === 0 || combinedGrade === "UNKNOWN") return;

    try {
      setCombinedPhase("grading");
      setCombinedPhaseError(null);

      await AdminService.userAppearance.bulkSetUserAppearanceGrade(
        selectedUsers,
        combinedGrade,
      );
      appearanceGradeEventBus.publish();

      setCombinedPhase("approving");
      setCombinedApproveProgress(0);
      setCombinedApproveCurrent(0);
      setCombinedApproveTotal(selectedUsers.length);
      setCombinedApproveResults([]);

      const results = await AdminService.userReview.bulkApproveUsers(
        selectedUsers,
        (current, total) => {
          setCombinedApproveCurrent(current);
          setCombinedApproveProgress(Math.round((current / total) * 100));
        },
      );

      setCombinedApproveResults(results);
      setCombinedPhase("done");

      const succeededIds = results
        .filter((r) => r.success)
        .map((r) => r.userId);
      if (succeededIds.length > 0) {
        onUsersRemove(succeededIds);
      }
      onRefresh();
    } catch (err: unknown) {
      setCombinedPhaseError(
        getErrorMessage(err, "처리 중 오류가 발생했습니다."),
      );
      setCombinedPhase("done");
      onRefresh();
    }
  };

  const displayError = localError || error;

  return (
    <div>
      {displayError && (
        <Alert
          style={{ marginBottom: 8, borderRadius: 8 }}
          status="danger"
          role="alert"
        >
          <Alert.Content>{displayError}</Alert.Content>
          <Button
            variant="ghost"
            isIconOnly
            aria-label="알림 닫기"
            onPress={() => setLocalError(null)}
          >
            닫기
          </Button>
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
          style={{ color: selectedUsers.length > 0 ? "#1E293B" : "#64748B" }}
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
            "왼쪽 체크박스를 선택하면 일괄 작업 버튼이 활성화됩니다."
          )}
        </div>
        <div className={"flex flex-wrap items-center gap-2"}>
          <Button
            onClick={() => setBulkGradeModalOpen(true)}
            style={{ borderRadius: 8, textTransform: "none", fontWeight: 500 }}
            variant={"secondary"}
            isDisabled={selectedUsers.length === 0}
            size={"sm"}
            className="rounded-xl"
          >
            일괄 등급 설정
          </Button>
          {isGradeRequiredCohort && (
            <>
              <Button
                onClick={() => setBulkApproveModalOpen(true)}
                style={{
                  borderRadius: 8,
                  textTransform: "none",
                  fontWeight: 500,
                }}
                variant={"secondary"}
                isDisabled={selectedUsers.length === 0}
                size={"sm"}
                className="rounded-xl"
              >
                일괄 승인
              </Button>
              <Button
                onClick={() => {
                  setCombinedGrade("UNKNOWN");
                  setCombinedPhase("select");
                  setCombinedPhaseError(null);
                  setCombinedWorkflowModalOpen(true);
                }}
                style={{
                  borderRadius: 8,
                  textTransform: "none",
                  fontWeight: 500,
                }}
                variant={"primary"}
                isDisabled={selectedUsers.length === 0}
                size={"sm"}
                className="rounded-xl"
              >
                등급 설정 + 승인
              </Button>
            </>
          )}
        </div>
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
          style={{ minWidth: 1100 }}
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
              <th style={{ ...headerCellSx, minWidth: 80 }}>지역</th>
              <th style={headerCellSx}>대학교</th>
              <th style={{ ...headerCellSx, textAlign: "center" }}>구분</th>
              <th style={{ ...headerCellSx, textAlign: "center" }}>승인사진</th>
              <th style={{ ...headerCellSx, textAlign: "center" }}>등급</th>
              <th style={headerCellSx}>인스타그램</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={{ paddingTop: 24, paddingBottom: 24 }}>
                  <Spinner aria-label="불러오는 중" size="sm" />
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ paddingTop: 24, paddingBottom: 24 }}>
                  <div className={"text-sm text-neutral-700"}>
                    조회된 사용자가 없습니다.
                  </div>
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const userId = getUserId(user);
                const instagramId = getInstagramId(user);
                const approvedPhotoCount = Number(user.approvedPhotoCount ?? 0);
                const isBlindApproved = isBlindApprovedUser(user);

                return (
                  <tr
                    key={userId}
                    style={{
                      backgroundColor: isBlindApproved
                        ? `color-mix(in srgb, ${"#2563EB"} 3%, transparent)`
                        : "inherit",
                      transition: "background-color 0.15s",
                    }}
                  >
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
                    <td style={bodyCellSx}>
                      <div
                        style={{ color: "#334155" }}
                        className={"text-sm text-neutral-700"}
                      >
                        {getRegionLabel(user.region)}
                      </div>
                    </td>
                    <td style={bodyCellSx}>
                      <div
                        style={{ color: "#334155" }}
                        className={"text-sm text-neutral-700"}
                      >
                        {getUniversityName(user)}
                      </div>
                    </td>
                    <td style={{ ...bodyCellSx, textAlign: "center" }}>
                      <Chip
                        style={{
                          backgroundColor: isBlindApproved
                            ? `color-mix(in srgb, ${"#2563EB"} 10%, transparent)`
                            : `color-mix(in srgb, ${"#D97706"} 12%, transparent)`,
                          color: isBlindApproved ? "#2563EB" : "#D97706",
                          fontWeight: 700,
                          fontSize: "0.75rem",
                        }}
                        size={"sm"}
                        variant={"soft"}
                      >
                        {isBlindApproved ? "블라인드 승인" : "등급 필요"}
                      </Chip>
                    </td>
                    <td style={{ ...bodyCellSx, textAlign: "center" }}>
                      <Chip
                        style={{
                          backgroundColor:
                            approvedPhotoCount > 0
                              ? `color-mix(in srgb, ${"#059669"} 10%, transparent)`
                              : "#fff",
                          borderColor:
                            approvedPhotoCount > 0
                              ? `color-mix(in srgb, ${"#059669"} 20%, transparent)`
                              : `color-mix(in srgb, ${"#D97706"} 35%, transparent)`,
                          color: approvedPhotoCount > 0 ? "#047857" : "#D97706",
                          fontWeight: 700,
                          fontSize: "0.75rem",
                        }}
                        size={"sm"}
                        variant={"soft"}
                      >{`${approvedPhotoCount}장`}</Chip>
                    </td>
                    <td style={{ ...bodyCellSx, textAlign: "center" }}>
                      <HeroActionButton
                        variant="ghost"
                        className="h-auto min-w-0 p-0"
                        onClick={(e) => handleOpenGradeMenu(e, user)}
                      >
                        <Chip
                          style={{
                            backgroundColor: GRADE_COLORS[user.appearanceGrade],
                            color: "white",
                            fontWeight: 700,
                            cursor: "pointer",
                            fontSize: "0.75rem",
                            minWidth: 48,
                          }}
                          size={"sm"}
                          variant={"soft"}
                        >
                          {GRADE_LABELS[user.appearanceGrade]}
                        </Chip>
                      </HeroActionButton>
                    </td>
                    <td style={bodyCellSx}>
                      {instagramId ? (
                        <a
                          href={`https://instagram.com/${instagramId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            textDecoration: "none",
                            color: "#7A4AE2",
                            fontSize: "0.8125rem",
                          }}
                        >
                          <Instagram />
                          {instagramId}
                          <ExternalLink />
                        </a>
                      ) : (
                        <div
                          style={{ color: "#94A3B8" }}
                          className={"text-sm text-neutral-700"}
                        >
                          -
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {/* 페이지네이션 */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
        <div className={"flex flex-wrap items-center gap-2"}>
          <Button
            onClick={() => onPageChange(page - 1)}
            style={{ minWidth: 32, borderRadius: 4 }}
            variant={"ghost"}
            isDisabled={page <= 1}
            size={"sm"}
            className="rounded-xl"
          >
            ◀
          </Button>
          <div
            style={{ paddingLeft: 6, paddingRight: 6, color: "#475569" }}
            className={"text-sm text-neutral-700"}
          >
            {page}/ {totalPages}
          </div>
          <Button
            onClick={() => onPageChange(page + 1)}
            style={{ minWidth: 32, borderRadius: 4 }}
            variant={"ghost"}
            isDisabled={page >= totalPages}
            size={"sm"}
            className="rounded-xl"
          >
            ▶
          </Button>
        </div>
      </div>
      {/* 개별 등급 변경 메뉴 */}
      <Modal.Backdrop
        isOpen={Boolean(gradeMenuAnchorEl)}
        onOpenChange={(isOpen) => {
          if (!isOpen) handleCloseGradeMenu?.();
        }}
        isDismissable={handleCloseGradeMenu !== undefined}
      >
        <Modal.Container size="md" scroll="inside">
          <Modal.Dialog>
            {(["S", "A", "B", "C", "UNKNOWN"] as AppearanceGrade[]).map(
              (grade) => (
                <Button
                  key={grade}
                  onClick={() => handleSaveGrade(grade)}
                  style={{
                    paddingTop: 4,
                    paddingBottom: 4,
                    fontSize: "0.875rem",
                    fontWeight:
                      selectedUser?.appearanceGrade === grade ? 700 : 400,
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
                  {selectedUser?.appearanceGrade === grade && " ✓"}
                </Button>
              ),
            )}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
      {/* 일괄 등급 설정 다이얼로그 */}
      <Modal.Backdrop
        isOpen={bulkGradeModalOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen)
            (() => !savingBulkGrade && setBulkGradeModalOpen(false))?.();
        }}
        isDismissable={
          (() => !savingBulkGrade && setBulkGradeModalOpen(false)) !== undefined
        }
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
                            textValue={
                              "GRADE_LABELS[grade]등급\n                  "
                            }
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
                onClick={() => setBulkGradeModalOpen(false)}
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
      {/* 일괄 승인 다이얼로그 */}
      <Modal.Backdrop
        isOpen={bulkApproveModalOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) (() => !approving && setBulkApproveModalOpen(false))?.();
        }}
        isDismissable={
          (() => !approving && setBulkApproveModalOpen(false)) !== undefined
        }
      >
        <Modal.Container size="md" scroll="inside">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>일괄 프로필 승인</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              {!approving && !approveCompleted ? (
                <div
                  style={{ paddingTop: 8, paddingBottom: 8 }}
                  className={"text-sm text-neutral-700"}
                >
                  선택한 <strong>{selectedUsers.length}명</strong>의 프로필을
                  승인하시겠습니까?
                </div>
              ) : (
                <div style={{ paddingTop: 8, paddingBottom: 8 }}>
                  <div style={{ marginBottom: 8 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 2,
                      }}
                    >
                      <div
                        style={{ color: "#475569" }}
                        className={"text-sm text-neutral-700"}
                      >
                        {approveCompleted ? "처리 완료" : "처리 중..."}
                      </div>
                      <div
                        style={{ fontWeight: 600, color: "#1E293B" }}
                        className={"text-sm text-neutral-700"}
                      >
                        {approveCurrent}/ {approveTotal}
                      </div>
                    </div>
                    <ProgressBar value={approveProgress} aria-label="진행률">
                      <ProgressBar.Track>
                        <ProgressBar.Fill />
                      </ProgressBar.Track>
                    </ProgressBar>
                  </div>
                  <div style={{ maxHeight: 240, overflowY: "auto" }}>
                    {approveResults.map((result) => (
                      <div
                        key={result.userId}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          paddingTop: 2,
                          paddingBottom: 2,
                        }}
                      >
                        <div
                          style={{ fontSize: "0.825rem" }}
                          className={"text-sm text-neutral-700"}
                        >
                          {result.success ? "✅" : "❌"}
                        </div>
                        <div
                          style={{ color: "#334155" }}
                          className={"text-sm text-neutral-700"}
                        >
                          {result.userId}
                        </div>
                        {!result.success && result.error && (
                          <div
                            style={{ color: "#EF4444" }}
                            className={"text-sm text-neutral-700"}
                          >
                            - {result.error}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Modal.Body>
            <Modal.Footer>
              {!approving && !approveCompleted ? (
                <>
                  <Button
                    onClick={() => setBulkApproveModalOpen(false)}
                    variant={"ghost"}
                    isDisabled={undefined}
                    size={"md"}
                    className="rounded-xl"
                  >
                    취소
                  </Button>
                  <Button
                    onClick={handleBulkApprove}
                    variant={"primary"}
                    isDisabled={undefined}
                    size={"md"}
                    className="rounded-xl"
                  >
                    승인
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => {
                    setBulkApproveModalOpen(false);
                    setApproveResults([]);
                    setApproveCompleted(false);
                  }}
                  variant={"primary"}
                  isDisabled={!approveCompleted}
                  size={"md"}
                  className="rounded-xl"
                >
                  닫기
                </Button>
              )}
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
      {/* 등급 설정 + 승인 연계 다이얼로그 */}
      <Modal.Backdrop
        isOpen={combinedWorkflowModalOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen)
            (() =>
              combinedPhase === "select" &&
              setCombinedWorkflowModalOpen(false))?.();
        }}
        isDismissable={
          (() =>
            combinedPhase === "select" &&
            setCombinedWorkflowModalOpen(false)) !== undefined
        }
      >
        <Modal.Container size="md" scroll="inside">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>등급 설정 + 프로필 승인</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              {combinedPhase === "select" && (
                <div style={{ paddingTop: 4 }}>
                  <div
                    style={{ marginBottom: 8, color: "#64748B" }}
                    className={"text-sm text-neutral-700"}
                  >
                    선택한 <strong>{selectedUsers.length}명</strong>에게 등급을
                    설정한 후 프로필을 승인합니다.
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <Label>등급</Label>
                    <Select
                      selectedKey={combinedGrade}
                      onSelectionChange={(value) =>
                        ((e) =>
                          setCombinedGrade(e.target.value as AppearanceGrade))({
                          target: { value },
                        } as React.ChangeEvent<HTMLSelectElement>)
                      }
                      isDisabled={undefined}
                      aria-label={"등급"}
                      className="w-full"
                    >
                      <Label>{"등급"}</Label>
                      <Select.Trigger>
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          {(["S", "A", "B", "C"] as AppearanceGrade[]).map(
                            (grade) => (
                              <ListBox.Item
                                key={grade}
                                id={grade}
                                textValue={
                                  "GRADE_LABELS[grade]등급\n                    "
                                }
                              >
                                {GRADE_LABELS[grade]}등급
                              </ListBox.Item>
                            ),
                          )}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  </div>
                </div>
              )}
              {(combinedPhase === "grading" ||
                combinedPhase === "approving" ||
                combinedPhase === "done") && (
                <div style={{ paddingTop: 8, paddingBottom: 8 }}>
                  <div
                    style={{ marginBottom: 4, color: "#1E293B" }}
                    className={"text-sm text-neutral-700"}
                  >
                    1단계: 등급 설정
                  </div>
                  <div
                    style={{
                      marginBottom: 8,
                      padding: 6,
                      borderRadius: 8,
                      backgroundColor:
                        combinedPhaseError && combinedPhase !== "approving"
                          ? `color-mix(in srgb, ${"#EF4444"} 8%, transparent)`
                          : `color-mix(in srgb, ${"#059669"} 8%, transparent)`,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    {combinedPhaseError && combinedPhase !== "approving" ? (
                      <>
                        <div className={"text-sm text-neutral-700"}>❌</div>
                        <div
                          style={{ color: "#EF4444" }}
                          className={"text-sm text-neutral-700"}
                        >
                          {combinedPhaseError}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className={"text-sm text-neutral-700"}>✅</div>
                        <div
                          style={{ color: "#059669" }}
                          className={"text-sm text-neutral-700"}
                        >
                          {combinedGrade}등급 일괄 설정 완료
                        </div>
                      </>
                    )}
                  </div>
                  <div
                    style={{ marginBottom: 4, color: "#1E293B" }}
                    className={"text-sm text-neutral-700"}
                  >
                    2단계: 프로필 승인
                  </div>
                  <div style={{ marginBottom: 4 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 2,
                      }}
                    >
                      <div
                        style={{ color: "#475569" }}
                        className={"text-sm text-neutral-700"}
                      >
                        {combinedPhase === "approving"
                          ? "처리 중..."
                          : combinedPhase === "done"
                            ? "처리 완료"
                            : ""}
                      </div>
                      <div
                        style={{ fontWeight: 600, color: "#1E293B" }}
                        className={"text-sm text-neutral-700"}
                      >
                        {combinedApproveCurrent}/ {combinedApproveTotal}
                      </div>
                    </div>
                    <ProgressBar
                      value={combinedApproveProgress}
                      aria-label="진행률"
                    >
                      <ProgressBar.Track>
                        <ProgressBar.Fill />
                      </ProgressBar.Track>
                    </ProgressBar>
                  </div>
                  <div style={{ maxHeight: 200, overflowY: "auto" }}>
                    {combinedApproveResults.map((result) => (
                      <div
                        key={result.userId}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          paddingTop: 2,
                          paddingBottom: 2,
                        }}
                      >
                        <div
                          style={{ fontSize: "0.825rem" }}
                          className={"text-sm text-neutral-700"}
                        >
                          {result.success ? "✅" : "❌"}
                        </div>
                        <div
                          style={{ color: "#334155" }}
                          className={"text-sm text-neutral-700"}
                        >
                          {result.userId}
                        </div>
                        {!result.success && result.error && (
                          <div
                            style={{ color: "#EF4444" }}
                            className={"text-sm text-neutral-700"}
                          >
                            - {result.error}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Modal.Body>
            <Modal.Footer>
              {combinedPhase === "select" ? (
                <>
                  <Button
                    onClick={() => setCombinedWorkflowModalOpen(false)}
                    variant={"ghost"}
                    isDisabled={undefined}
                    size={"md"}
                    className="rounded-xl"
                  >
                    취소
                  </Button>
                  <Button
                    onClick={handleCombinedWorkflow}
                    variant={"primary"}
                    isDisabled={combinedGrade === "UNKNOWN"}
                    size={"md"}
                    className="rounded-xl"
                  >
                    실행
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => {
                    setCombinedWorkflowModalOpen(false);
                    setCombinedApproveResults([]);
                  }}
                  variant={"primary"}
                  isDisabled={combinedPhase !== "done"}
                  size={"md"}
                  className="rounded-xl"
                >
                  닫기
                </Button>
              )}
            </Modal.Footer>
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
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
}
