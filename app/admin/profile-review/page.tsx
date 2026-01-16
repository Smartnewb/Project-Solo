"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Dialog,
  IconButton,
  TextField,
  InputAdornment,
  Tooltip,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Badge,
  LinearProgress,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import FilterListIcon from "@mui/icons-material/FilterList";
import RefreshIcon from "@mui/icons-material/Refresh";
import AdminService, { PendingUsersFilter } from "@/app/services/admin";
import UserTableList from "./components/UserTableList";
import ImageReviewPanel from "./components/ImageReviewPanel";
import RejectReasonModal from "./components/RejectReasonModal";
import { REGION_MAP } from "../sales/constants/regions";

export interface PendingProfileImage {
  id: string;
  imageUrl: string;
  imageOrder: number;
  isMain: boolean;
  createdAt?: string;
}

export interface PendingImage {
  id: string;
  imageUrl: string;
  imageOrder: number;
  slotIndex: number; // 0: 대표사진, 1-2: 서브사진
  isMain: boolean;
}

export interface CurrentProfileImage {
  id: string;
  imageUrl: string;
  imageOrder: number;
  slotIndex: number;
  isMain: boolean;
  approvedAt: string;
}

export interface RejectionHistory {
  category: string;
  reason: string;
  createdAt: string;
}

export interface PreferenceOption {
  typeName: string;
  options: string[];
}

export interface RejectedImage {
  id: string;
  imageUrl: string;
  slotIndex: number;
  rejectionReason: string;
  rejectedAt: string;
}

export interface ReviewContext {
  reportCount: number;
  hasSuspensionHistory: boolean;
  userCreatedAt: string;
  isFirstReview: boolean;
  receivedLikeCount: number;
  matchCount: number;
  chatRoomCount: number;
  hasPurchased: boolean;
  totalPurchaseAmount?: number;
  isUniversityVerified: boolean;
}

export interface PendingUser {
  // 필수 필드 (API 응답에서 항상 존재)
  userId: string;
  profileId: string;
  userName: string;
  age: number;
  gender: "MALE" | "FEMALE";
  isApproved: boolean;
  approved: boolean;
  pendingImages: PendingImage[];
  approvedImageUrls: string[];
  profileUsing?: CurrentProfileImage[];
  createdAt: string;
  rank?: "S" | "A" | "B" | "C" | "UNKNOWN";

  // 선택적 필드
  email?: string;
  phone?: string;
  universityName?: string;
  department?: string;
  mbti?: string;
  bio?: string;
  instagramId?: string;
  preferences?: PreferenceOption[];
  rejectionHistory?: RejectionHistory[];
  rejectedImages?: RejectedImage[];
  reviewContext?: ReviewContext;

  // UI용 추가 필드 (하위 호환성)
  id?: string;
  name?: string;
  profileImageUrls?: string[];
  profileImages?: PendingProfileImage[];
  phoneNumber?: string;
  birthday?: string | null;
  university?: string | null;
  region?: string | null;
  profileImageUrl?: string | null;
  status?: string;
  statusAt?: string | null;
  instagram?: string;
  instagramUrl?: string | null;
  appearanceGrade?: string;
  rejectionReason?: string | null;
  signupRoute?: string | null;
}

export interface PendingUsersResponse {
  users: PendingUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// 건너뛴 유저 관리 유틸리티
const SKIPPED_USERS_KEY = "skippedReviewUsers";

const getSkippedUsers = (): string[] => {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(SKIPPED_USERS_KEY) || "[]");
  } catch {
    return [];
  }
};

const addSkippedUser = (userId: string): void => {
  const skipped = getSkippedUsers();
  if (!skipped.includes(userId)) {
    skipped.push(userId);
    localStorage.setItem(SKIPPED_USERS_KEY, JSON.stringify(skipped));
  }
};

const removeSkippedUser = (userId: string): void => {
  const skipped = getSkippedUsers();
  const updated = skipped.filter((id) => id !== userId);
  localStorage.setItem(SKIPPED_USERS_KEY, JSON.stringify(updated));
};

const clearAllSkippedUsers = (): void => {
  localStorage.removeItem(SKIPPED_USERS_KEY);
};

// 지역 옵션 (전체 제외)
const REGION_OPTIONS = Object.entries(REGION_MAP)
  .filter(([code]) => code !== "all")
  .map(([code, name]) => ({ value: code, label: name }));

export default function ProfileReviewPage() {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [currentRejectUserId, setCurrentRejectUserId] = useState<string | null>(
    null,
  );
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    hasMore: false,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [localSearchTerm, setLocalSearchTerm] = useState("");

  // 필터 상태
  const [filterExpanded, setFilterExpanded] = useState(false);
  const [filters, setFilters] = useState<PendingUsersFilter>({});
  const [skippedUsers, setSkippedUsers] = useState<string[]>([]);

  // 일괄 반려 상태
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [bulkRejectModalOpen, setBulkRejectModalOpen] = useState(false);
  const [bulkRejectProgress, setBulkRejectProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);

  // 건너뛴 유저 목록 로드
  useEffect(() => {
    setSkippedUsers(getSkippedUsers());
  }, []);

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const extractImageIdFromUrl = (url: string): string => {
    const matches = url.match(/\/([0-9a-f-]+)\.(jpg|jpeg|png|gif|webp)$/i);
    return matches
      ? matches[1]
      : `url-${url.split("/").pop()?.split(".")[0] || "unknown"}`;
  };

  const fetchPendingUsers = async (
    page: number = 1,
    search?: string,
    currentFilters?: PendingUsersFilter,
    currentSkippedUsers?: string[],
  ) => {
    try {
      setLoading(true);
      setError(null);

      const searchQuery = search !== undefined ? search : searchTerm;
      const appliedFilters = currentFilters !== undefined ? currentFilters : filters;
      const excludeUserIds = currentSkippedUsers !== undefined ? currentSkippedUsers : getSkippedUsers();
      console.log(
        "심사 대기 유저 목록 조회 시작... (page:",
        page,
        ", search:",
        searchQuery,
        ", filters:",
        appliedFilters,
        ")",
      );
      const response: PendingUsersResponse =
        await AdminService.userReview.getPendingUsers(
          page,
          20,
          searchQuery || undefined,
          Object.keys(appliedFilters).length > 0 ? appliedFilters : undefined,
          excludeUserIds.length > 0 ? excludeUserIds : undefined,
        );

      console.log("API 응답 데이터:", response);

      if (!response || !response.users) {
        throw new Error(
          "API 응답 형식이 올바르지 않습니다. users 배열이 없습니다.",
        );
      }

      // 응답 데이터 정규화 (UI 호환성을 위한 추가 필드)
      const normalizedUsers: PendingUser[] = response.users.map((user) => {
        // 전체 이미지 URL 목록 (승인된 이미지 + 대기 중인 이미지)
        const allImageUrls = [
          ...(user.approvedImageUrls || []),
          ...(user.pendingImages || []).map((img) => img.imageUrl),
        ];

        return {
          ...user,
          // UI 호환성을 위한 추가 필드
          id: user.userId,
          name: user.userName,
          profileImages: user.pendingImages,
          profileImageUrls: allImageUrls,
          // 기본값 설정
          preferences: user.preferences || [],
          rejectionHistory: user.rejectionHistory || [],
        };
      });

      console.log("정규화된 사용자 데이터:", normalizedUsers);

      setUsers(normalizedUsers);
      setPagination(response.pagination);
      return normalizedUsers;
    } catch (err: any) {
      console.error("심사 대기 목록 조회 중 오류:", err);
      console.error("오류 메시지:", err.message);
      console.error("오류 스택:", err.stack);
      console.error("HTTP 응답:", err.response);
      console.error("HTTP 상태:", err.response?.status);
      console.error("응답 데이터:", err.response?.data);

      // 401 에러 처리 (인증 실패)
      if (err.response?.status === 401) {
        console.error("인증 오류 발생 - 로그인이 필요합니다.");
        setError("인증이 만료되었습니다. 다시 로그인해주세요.");
        // axios interceptor가 자동으로 refresh를 시도하고 실패하면 로그인 페이지로 리다이렉트됩니다.
        return [];
      }

      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "심사 대기 목록을 불러오는 중 오류가 발생했습니다.";

      setError(`${errorMessage} (상태코드: ${err.response?.status || "N/A"})`);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (user: PendingUser) => {
    // 새로운 API 응답에는 이미 모든 정보가 포함되어 있음
    setSelectedUser(user);
  };

  const handleImageApproved = async (imageId: string) => {
    if (!selectedUser) return;

    // 선택된 사용자의 pendingImages에서 해당 이미지 제거
    const updatedPendingImages = (selectedUser.pendingImages || []).filter(
      (img) => img.id !== imageId,
    );
    const updatedUser = {
      ...selectedUser,
      pendingImages: updatedPendingImages,
    };

    // pendingImages가 비어있으면 서버에서 새 목록 가져오기
    if (updatedPendingImages.length === 0) {
      setSelectedUser(null);
      await fetchPendingUsers(pagination.page, searchTerm, filters);
    } else {
      // 사용자 목록에서도 업데이트
      setUsers(
        (prevUsers) =>
          prevUsers
            .map((u) => {
              if (u.userId === selectedUser.userId || u.id === selectedUser.id) {
                return updatedUser;
              }
              return u;
            }) as PendingUser[],
      );
      setSelectedUser(updatedUser);
    }
  };

  const handleImageRejected = async (imageId: string) => {
    if (!selectedUser) return;

    // 선택된 사용자의 pendingImages에서 해당 이미지 제거
    const updatedPendingImages = (selectedUser.pendingImages || []).filter(
      (img) => img.id !== imageId,
    );
    const updatedUser = {
      ...selectedUser,
      pendingImages: updatedPendingImages,
    };

    // pendingImages가 비어있으면 서버에서 새 목록 가져오기
    if (updatedPendingImages.length === 0) {
      setSelectedUser(null);
      await fetchPendingUsers(pagination.page, searchTerm, filters);
    } else {
      // 사용자 목록에서도 업데이트
      setUsers(
        (prevUsers) =>
          prevUsers
            .map((u) => {
              if (u.userId === selectedUser.userId || u.id === selectedUser.id) {
                return updatedUser;
              }
              return u;
            }) as PendingUser[],
      );
      setSelectedUser(updatedUser);
    }
  };

  const handleApproveUser = async (userId: string) => {
    try {
      setProcessing(true);
      await AdminService.userReview.approveUser(userId);

      // 선택된 사용자가 승인된 경우 선택 해제
      if (selectedUser?.userId === userId || selectedUser?.id === userId) {
        setSelectedUser(null);
      }

      await fetchPendingUsers(pagination.page, searchTerm, filters);
    } catch (err: any) {
      console.error("유저 승인 중 오류:", err);
      setError(
        err.response?.data?.message || "유저 승인 중 오류가 발생했습니다.",
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectUser = (userId: string) => {
    setCurrentRejectUserId(userId);
    setRejectModalOpen(true);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    fetchPendingUsers(1, term, filters);
  };

  // 필터 변경 핸들러
  const handleFilterChange = (key: keyof PendingUsersFilter, value: any) => {
    const newFilters = { ...filters };
    if (value === "" || value === null || value === undefined) {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }
    setFilters(newFilters);
  };

  const handleApplyFilters = () => {
    fetchPendingUsers(1, searchTerm, filters);
  };

  const handleClearFilters = () => {
    setFilters({});
    fetchPendingUsers(1, searchTerm, {});
  };

  const getActiveFilterCount = () => {
    return Object.keys(filters).filter(
      (key) => filters[key as keyof PendingUsersFilter] !== undefined,
    ).length;
  };

  // 건너뛰기 핸들러
  const handleSkipUser = async (userId: string) => {
    addSkippedUser(userId);
    const updatedSkippedUsers = getSkippedUsers();
    setSkippedUsers(updatedSkippedUsers);
    // 선택된 사용자가 건너뛴 경우 선택 해제
    if (selectedUser?.userId === userId || selectedUser?.id === userId) {
      setSelectedUser(null);
    }
    // 서버에서 건너뛴 유저 제외하고 목록 새로고침
    await fetchPendingUsers(pagination.page, searchTerm, filters, updatedSkippedUsers);
  };

  const handleRestoreSkippedUser = async (userId: string) => {
    removeSkippedUser(userId);
    const updatedSkippedUsers = getSkippedUsers();
    setSkippedUsers(updatedSkippedUsers);
    // 서버에서 목록 새로고침
    await fetchPendingUsers(pagination.page, searchTerm, filters, updatedSkippedUsers);
  };

  const handleClearAllSkipped = async () => {
    clearAllSkippedUsers();
    setSkippedUsers([]);
    // 서버에서 목록 새로고침 (건너뛴 유저 없이)
    await fetchPendingUsers(pagination.page, searchTerm, filters, []);
  };

  const handleSearchToggle = () => {
    if (searchExpanded && localSearchTerm) {
      setLocalSearchTerm("");
      handleSearch("");
    }
    setSearchExpanded(!searchExpanded);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(localSearchTerm);
  };

  const handleSearchClear = () => {
    setLocalSearchTerm("");
    handleSearch("");
  };

  const handleUserCheck = (userId: string, checked: boolean) => {
    setSelectedUserIds((prev) =>
      checked ? [...prev, userId] : prev.filter((id) => id !== userId),
    );
  };

  const handleSelectAllCheck = (checked: boolean) => {
    setSelectedUserIds(checked ? users.map((user) => user.userId) : []);
  };

  const handleBulkReject = () => {
    if (selectedUserIds.length === 0) return;
    setBulkRejectModalOpen(true);
  };

  const handleBulkRejectConfirm = async (category: string, reason: string) => {
    if (selectedUserIds.length === 0) return;

    try {
      setProcessing(true);
      setBulkRejectModalOpen(false);
      setBulkRejectProgress({ current: 0, total: selectedUserIds.length });

      const results = await AdminService.userReview.bulkRejectUsers(
        selectedUserIds,
        category,
        reason,
        (current, total) => {
          setBulkRejectProgress({ current, total });
        },
      );

      const successCount = results.filter((r) => r.success).length;
      const failCount = results.length - successCount;

      if (selectedUser && selectedUserIds.includes(selectedUser.userId)) {
        setSelectedUser(null);
      }

      setSelectedUserIds([]);
      setBulkRejectProgress(null);

      if (failCount > 0) {
        setError(
          `${successCount}명 반려 완료, ${failCount}명 실패했습니다.`,
        );
      }

      await fetchPendingUsers(pagination.page, searchTerm, filters);
    } catch (err: any) {
      console.error("일괄 반려 중 오류:", err);
      setError(
        err.response?.data?.message ||
          "일괄 반려 중 오류가 발생했습니다.",
      );
      setBulkRejectProgress(null);
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectConfirm = async (category: string, reason: string) => {
    if (!currentRejectUserId) return;

    try {
      setProcessing(true);
      setRejectModalOpen(false);
      await AdminService.userReview.rejectUser(
        currentRejectUserId,
        category,
        reason,
      );

      // 선택된 사용자가 거절된 경우 선택 해제
      if (
        selectedUser?.userId === currentRejectUserId ||
        selectedUser?.id === currentRejectUserId
      ) {
        setSelectedUser(null);
      }

      setCurrentRejectUserId(null);

      await fetchPendingUsers(pagination.page, searchTerm, filters);
    } catch (err: any) {
      console.error("유저 반려 중 오류:", err);
      setError(
        err.response?.data?.message || "유저 반려 중 오류가 발생했습니다.",
      );
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>심사 대기 목록을 불러오는 중...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <Typography variant="h5">회원 적격 심사</Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {/* 건너뛴 유저 복원 버튼 */}
          {skippedUsers.length > 0 && (
            <Tooltip title={`건너뛴 ${skippedUsers.length}명 복원`}>
              <Button
                size="small"
                variant="outlined"
                color="warning"
                onClick={handleClearAllSkipped}
                startIcon={<RefreshIcon />}
              >
                건너뛴 {skippedUsers.length}명
              </Button>
            </Tooltip>
          )}

          {/* 필터 버튼 */}
          <Tooltip title="필터">
            <IconButton
              onClick={() => setFilterExpanded(!filterExpanded)}
              color={getActiveFilterCount() > 0 ? "primary" : "default"}
            >
              <Badge badgeContent={getActiveFilterCount()} color="primary">
                <FilterListIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* 검색 */}
          <Collapse in={searchExpanded} orientation="horizontal" timeout={200}>
            <Box
              component="form"
              onSubmit={handleSearchSubmit}
              sx={{ display: "flex", alignItems: "center", mr: 1 }}
            >
              <TextField
                size="small"
                placeholder="이름, 전화번호, 이메일 검색"
                value={localSearchTerm}
                onChange={(e) => setLocalSearchTerm(e.target.value)}
                autoFocus
                sx={{ width: 250 }}
                InputProps={{
                  endAdornment: localSearchTerm && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={handleSearchClear}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </Collapse>
          <Tooltip title={searchExpanded ? "검색 닫기" : "검색"}>
            <IconButton
              onClick={handleSearchToggle}
              color={searchTerm ? "primary" : "default"}
            >
              <SearchIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* 일괄 반려 버튼 */}
      {selectedUserIds.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Button
            variant="contained"
            color="error"
            onClick={handleBulkReject}
            disabled={processing}
          >
            선택된 {selectedUserIds.length}명 일괄 반려
          </Button>
        </Box>
      )}

      {/* 진행 상태 표시 */}
      {bulkRejectProgress && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            반려 진행 중: {bulkRejectProgress.current} / {bulkRejectProgress.total}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={(bulkRejectProgress.current / bulkRejectProgress.total) * 100}
          />
        </Box>
      )}

      {/* 필터 패널 */}
      <Collapse in={filterExpanded}>
        <Box
          sx={{
            mb: 2,
            p: 2,
            backgroundColor: "#f5f5f5",
            borderRadius: 2,
            display: "flex",
            gap: 2,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {/* 성별 필터 */}
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>성별</InputLabel>
            <Select
              value={filters.gender || ""}
              label="성별"
              onChange={(e) => handleFilterChange("gender", e.target.value)}
            >
              <MenuItem value="">전체</MenuItem>
              <MenuItem value="MALE">남성</MenuItem>
              <MenuItem value="FEMALE">여성</MenuItem>
            </Select>
          </FormControl>

          {/* 나이 필터 */}
          <TextField
            size="small"
            type="number"
            label="최소 나이"
            value={filters.minAge || ""}
            onChange={(e) =>
              handleFilterChange(
                "minAge",
                e.target.value ? Number(e.target.value) : undefined,
              )
            }
            sx={{ width: 100 }}
            InputProps={{ inputProps: { min: 18, max: 100 } }}
          />
          <Typography variant="body2" color="text.secondary">
            ~
          </Typography>
          <TextField
            size="small"
            type="number"
            label="최대 나이"
            value={filters.maxAge || ""}
            onChange={(e) =>
              handleFilterChange(
                "maxAge",
                e.target.value ? Number(e.target.value) : undefined,
              )
            }
            sx={{ width: 100 }}
            InputProps={{ inputProps: { min: 18, max: 100 } }}
          />

          {/* 지역 필터 */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>지역</InputLabel>
            <Select
              value={filters.region || ""}
              label="지역"
              onChange={(e) => handleFilterChange("region", e.target.value)}
            >
              <MenuItem value="">전체</MenuItem>
              {REGION_OPTIONS.map((region) => (
                <MenuItem key={region.value} value={region.value}>
                  {region.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* 필터 적용/초기화 버튼 */}
          <Button
            variant="contained"
            size="small"
            onClick={handleApplyFilters}
            sx={{ height: 40 }}
          >
            적용
          </Button>
          {getActiveFilterCount() > 0 && (
            <Button
              variant="outlined"
              size="small"
              onClick={handleClearFilters}
              sx={{ height: 40 }}
            >
              초기화
            </Button>
          )}

          {/* 현재 적용된 필터 표시 */}
          {getActiveFilterCount() > 0 && (
            <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", ml: 1 }}>
              {filters.gender && (
                <Chip
                  label={`성별: ${filters.gender === "MALE" ? "남성" : "여성"}`}
                  size="small"
                  onDelete={() => handleFilterChange("gender", undefined)}
                />
              )}
              {filters.minAge && (
                <Chip
                  label={`최소: ${filters.minAge}세`}
                  size="small"
                  onDelete={() => handleFilterChange("minAge", undefined)}
                />
              )}
              {filters.maxAge && (
                <Chip
                  label={`최대: ${filters.maxAge}세`}
                  size="small"
                  onDelete={() => handleFilterChange("maxAge", undefined)}
                />
              )}
              {filters.region && (
                <Chip
                  label={`지역: ${REGION_MAP[filters.region] || filters.region}`}
                  size="small"
                  onDelete={() => handleFilterChange("region", undefined)}
                />
              )}
            </Box>
          )}
        </Box>
      </Collapse>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: "flex", gap: 3, height: "calc(100vh - 200px)" }}>
        <Box sx={{ flex: "7", overflow: "auto" }}>
          <UserTableList
            users={users}
            selectedUser={selectedUser}
            onUserSelect={handleUserSelect}
            onSkipUser={handleSkipUser}
            pagination={pagination}
            onPageChange={(page) => fetchPendingUsers(page, searchTerm, filters)}
            searchTerm={searchTerm}
            selectedUserIds={selectedUserIds}
            onUserCheck={handleUserCheck}
            onSelectAllCheck={handleSelectAllCheck}
          />
        </Box>

        <Box sx={{ flex: "3", overflow: "auto" }}>
          <ImageReviewPanel
            user={selectedUser}
            onApprove={handleApproveUser}
            onReject={handleRejectUser}
            onImageApproved={handleImageApproved}
            onImageRejected={handleImageRejected}
            processing={processing}
            setProcessing={setProcessing}
          />
        </Box>
      </Box>

      <RejectReasonModal
        open={rejectModalOpen}
        onClose={() => {
          setRejectModalOpen(false);
          setCurrentRejectUserId(null);
        }}
        onConfirm={handleRejectConfirm}
      />

      <RejectReasonModal
        open={bulkRejectModalOpen}
        onClose={() => {
          setBulkRejectModalOpen(false);
        }}
        onConfirm={handleBulkRejectConfirm}
      />

      <Dialog
        open={processing}
        PaperProps={{
          sx: {
            backgroundColor: "transparent",
            boxShadow: "none",
            overflow: "hidden",
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            p: 4,
            backgroundColor: "white",
            borderRadius: 2,
            minWidth: 200,
          }}
        >
          <CircularProgress size={60} />
          <Typography sx={{ mt: 2, fontWeight: 600 }}>
            처리 중입니다...
          </Typography>
        </Box>
      </Dialog>
    </Box>
  );
}
