"use client";
import { Button, Spinner, Chip, Modal, Tabs, TextField, Label, Input, Select, ListBox } from '@heroui/react';
import { Search as SearchIcon, X as CloseIcon, ListFilter as FilterListIcon, RefreshCw as RefreshIcon } from 'lucide-react';
import { useState, useEffect, useMemo } from "react";
import AdminService, { PendingUsersFilter } from "@/app/services/admin";
import UserTableList from "./components/UserTableList";
import ImageReviewPanel from "./components/ImageReviewPanel";
import RejectReasonModal from "./components/RejectReasonModal";
import ReviewHistoryTab from "./components/ReviewHistoryTab";
import { useClusterOptions, getIndividualRegionLabel } from "@/components/admin/common/RegionFilter";
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
    canApprove?: boolean;
    canReject?: boolean;
    isRepresentativeReplacement?: boolean;
    reviewPurpose?: string | null;
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
    blindMatchingApprovedAt?: string | null;
    approvedPhotoCount?: number;
    hasApprovedPhoto?: boolean;
    approvalMode?: "PHOTO_APPROVED" | "BLIND_APPROVED" | "GRADE_REQUIRED" | string;
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
    data: PendingUser[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
// 건너뛴 유저 관리 유틸리티
const SKIPPED_USERS_KEY = "skippedReviewUsers";
const getSkippedUsers = (): string[] => {
    if (typeof window === "undefined")
        return [];
    try {
        return JSON.parse(localStorage.getItem(SKIPPED_USERS_KEY) || "[]");
    }
    catch {
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
// 지역 옵션은 useClusterOptions 훅에서 동적으로 가져옴 (컴포넌트 내부에서 사용)
interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}
function TabPanel({ children, value, index, ...other }: TabPanelProps) {
    return (<div role="tabpanel" hidden={value !== index} id={`review-tabpanel-${index}`} aria-labelledby={`review-tab-${index}`} {...other}>
      {value === index && <div style={{ paddingTop: 16 }}>{children}</div>}
    </div>);
}
function ProfileReviewV2Content() {
    const { individualOptions } = useClusterOptions();
    const REGION_OPTIONS = useMemo(() => individualOptions.filter(opt => opt.value !== 'ALL'), [individualOptions]);
    const [activeTab, setActiveTab] = useState(0);
    const [users, setUsers] = useState<PendingUser[]>([]);
    const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [currentRejectUserId, setCurrentRejectUserId] = useState<string | null>(null);
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
    const fetchPendingUsers = async (page: number = 1, search?: string, currentFilters?: PendingUsersFilter, currentSkippedUsers?: string[]) => {
        try {
            setLoading(true);
            setError(null);
            const searchQuery = search !== undefined ? search : searchTerm;
            const appliedFilters = currentFilters !== undefined ? currentFilters : filters;
            const excludeUserIds = currentSkippedUsers !== undefined ? currentSkippedUsers : getSkippedUsers();
            ;
            const response: PendingUsersResponse = await AdminService.userReview.getPendingUsers(page, 20, searchQuery || undefined, Object.keys(appliedFilters).length > 0 ? appliedFilters : undefined, excludeUserIds.length > 0 ? excludeUserIds : undefined);
            ;
            if (!response || !response.data) {
                throw new Error("API 응답 형식이 올바르지 않습니다. data 배열이 없습니다.");
            }
            // 응답 데이터 정규화 (V2 API 호환성)
            const normalizedUsers: PendingUser[] = response.data.map((user: any) => {
                const reviewContextSource = user.reviewContext || user.context || null;
                const approvedImgs = (user.approvedImages || user.approvedImageUrls || []);
                const profileUsing = Array.isArray(approvedImgs)
                    ? approvedImgs.map((img: any) => typeof img === 'string'
                        ? { id: '', imageUrl: img, imageOrder: 0, slotIndex: 0, isMain: false, approvedAt: '' }
                        : {
                            id: img.imageId ?? img.id ?? '',
                            imageUrl: img.url ?? img.imageUrl ?? '',
                            imageOrder: img.slotIndex ?? 0,
                            slotIndex: img.slotIndex ?? 0,
                            isMain: img.isMain ?? false,
                            approvedAt: img.approvedAt ?? '',
                        })
                    : [];
                // V2: pendingImages[].url, approvedImages[].url / V1: approvedImageUrls[], pendingImages[].imageUrl
                const pendingImgs = (user.pendingImages || []).map((img: any) => ({
                    id: img.imageId ?? img.id,
                    imageUrl: img.url ?? img.imageUrl,
                    imageOrder: img.slotIndex ?? img.imageOrder ?? 0,
                    slotIndex: img.slotIndex ?? 0,
                    isMain: img.isMain ?? false,
                    canApprove: img.canApprove,
                    canReject: img.canReject,
                    isRepresentativeReplacement: img.isRepresentativeReplacement ??
                        img.isMainReplacement ??
                        ((img.reviewPurpose === 'REPRESENTATIVE_REPLACEMENT' ||
                            img.reviewPurpose === 'MAIN_IMAGE_REPLACEMENT' ||
                            img.reviewPurpose === 'REPRESENTATIVE_IMAGE_REPLACEMENT') || ((img.slotIndex ?? 0) === 0 && profileUsing.some((current) => current.slotIndex === 0))),
                    reviewPurpose: img.reviewPurpose ?? null,
                }));
                const allImageUrls = [
                    ...(Array.isArray(approvedImgs) ? approvedImgs.map((img: any) => typeof img === 'string' ? img : img.url ?? img.imageUrl) : []),
                    ...pendingImgs.map((img: any) => img.imageUrl),
                ];
                return {
                    ...user,
                    // UI 호환성을 위한 추가 필드
                    id: user.userId,
                    userName: user.name ?? user.userName,
                    name: user.name ?? user.userName,
                    pendingImages: pendingImgs,
                    profileImages: pendingImgs,
                    profileImageUrls: allImageUrls,
                    profileUsing,
                    blindMatchingApprovedAt: user.blindMatchingApprovedAt ?? user.blind_matching_approved_at ?? null,
                    approvedPhotoCount: Number(user.approvedPhotoCount ?? user.approved_photo_count ?? profileUsing.length ?? 0),
                    hasApprovedPhoto: user.hasApprovedPhoto ??
                        user.has_approved_photo ??
                        profileUsing.length > 0,
                    approvalMode: user.approvalMode ?? user.approval_mode,
                    universityName: user.universityName ?? user.university ?? undefined,
                    // 기본값 설정
                    preferences: user.preferences || [],
                    rejectionHistory: user.rejectionHistory || [],
                    reviewContext: reviewContextSource
                        ? {
                            reportCount: Number(reviewContextSource.reportCount ?? 0),
                            hasSuspensionHistory: Boolean(reviewContextSource.hasSuspensionHistory),
                            userCreatedAt: reviewContextSource.userCreatedAt ??
                                reviewContextSource.createdAt ??
                                user.createdAt ??
                                "",
                            isFirstReview: Boolean(reviewContextSource.isFirstReview),
                            receivedLikeCount: Number(reviewContextSource.receivedLikeCount ?? 0),
                            matchCount: Number(reviewContextSource.matchCount ?? 0),
                            chatRoomCount: Number(reviewContextSource.chatRoomCount ?? 0),
                            hasPurchased: Boolean(reviewContextSource.hasPurchased) ||
                                Number(reviewContextSource.purchaseCount ?? 0) > 0 ||
                                Number(reviewContextSource.totalPurchaseAmount ?? 0) > 0,
                            totalPurchaseAmount: Number(reviewContextSource.totalPurchaseAmount ?? 0) || undefined,
                            isUniversityVerified: Boolean(reviewContextSource.isUniversityVerified),
                        }
                        : undefined,
                    isApproved: user.isApproved ?? false,
                    approved: user.approved ?? false,
                    createdAt: user.createdAt ?? '',
                };
            });
            ;
            setUsers(normalizedUsers);
            setPagination(response.meta ? {
                page: response.meta.page,
                limit: response.meta.limit,
                total: response.meta.total,
                hasMore: response.meta.page < response.meta.totalPages,
            } : { page: 1, limit: 20, total: 0, hasMore: false });
            return normalizedUsers;
        }
        catch (err: any) {
            // 401 에러 처리 (인증 실패)
            if (err.response?.status === 401) {
                setError("인증이 만료되었습니다. 다시 로그인해주세요.");
                // axios interceptor가 자동으로 refresh를 시도하고 실패하면 로그인 페이지로 리다이렉트됩니다.
                return [];
            }
            const errorMessage = err.response?.data?.message ||
                err.message ||
                "심사 대기 목록을 불러오는 중 오류가 발생했습니다.";
            setError(`${errorMessage} (상태코드: ${err.response?.status || "N/A"})`);
            return [];
        }
        finally {
            setLoading(false);
        }
    };
    const handleUserSelect = (user: PendingUser) => {
        // 새로운 API 응답에는 이미 모든 정보가 포함되어 있음
        setSelectedUser(user);
    };
    const handleImageApproved = async (imageId: string) => {
        if (!selectedUser)
            return;
        const updatedPendingImages = (selectedUser.pendingImages || []).filter((img) => img.id !== imageId);
        if (updatedPendingImages.length === 0) {
            setSelectedUser(null);
        }
        else {
            // 낙관적 업데이트 (refetch 전까지 즉시 반영)
            const updatedUser = { ...selectedUser, pendingImages: updatedPendingImages };
            setSelectedUser(updatedUser);
        }
        // 항상 서버에서 최신 목록 갱신
        await fetchPendingUsers(pagination.page, searchTerm, filters);
    };
    const handleImageRejected = async (imageId: string) => {
        if (!selectedUser)
            return;
        const updatedPendingImages = (selectedUser.pendingImages || []).filter((img) => img.id !== imageId);
        if (updatedPendingImages.length === 0) {
            setSelectedUser(null);
        }
        else {
            // 낙관적 업데이트 (refetch 전까지 즉시 반영)
            const updatedUser = { ...selectedUser, pendingImages: updatedPendingImages };
            setSelectedUser(updatedUser);
        }
        // 항상 서버에서 최신 목록 갱신
        await fetchPendingUsers(pagination.page, searchTerm, filters);
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
        }
        catch (err: any) {
            setError(err.response?.data?.message || "유저 승인 중 오류가 발생했습니다.");
        }
        finally {
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
        }
        else {
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
        return Object.keys(filters).filter((key) => filters[key as keyof PendingUsersFilter] !== undefined).length;
    };
    // 건너뛰기 핸들러
    const handleSkipUser = async (userId: string) => {
        addSkippedUser(userId);
        const updatedSkippedUsers = getSkippedUsers();
        setSkippedUsers(updatedSkippedUsers);
        // 즉시 UI에서 해당 유저 제거
        setUsers((prevUsers) => prevUsers.filter((user) => user.userId !== userId));
        // 선택된 사용자가 건너뛴 경우 선택 해제
        if (selectedUser?.userId === userId || selectedUser?.id === userId) {
            setSelectedUser(null);
        }
        // 서버에서 건너뛴 유저 제외하고 목록 새로고침 (백그라운드)
        fetchPendingUsers(pagination.page, searchTerm, filters, updatedSkippedUsers);
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
        setSelectedUserIds((prev) => checked ? [...prev, userId] : prev.filter((id) => id !== userId));
    };
    const handleSelectAllCheck = (checked: boolean) => {
        setSelectedUserIds(checked ? users.map((user) => user.userId) : []);
    };
    const handleBulkReject = () => {
        if (selectedUserIds.length === 0)
            return;
        setBulkRejectModalOpen(true);
    };
    const handleBulkRejectConfirm = async (category: string, reason: string) => {
        if (selectedUserIds.length === 0)
            return;
        try {
            setProcessing(true);
            setBulkRejectModalOpen(false);
            setBulkRejectProgress({ current: 0, total: selectedUserIds.length });
            const results = await AdminService.userReview.bulkRejectUsers(selectedUserIds, category, reason, (current, total) => {
                setBulkRejectProgress({ current, total });
            });
            const successCount = results.filter((r) => r.success).length;
            const failCount = results.length - successCount;
            if (selectedUser && selectedUserIds.includes(selectedUser.userId)) {
                setSelectedUser(null);
            }
            setSelectedUserIds([]);
            setBulkRejectProgress(null);
            if (failCount > 0) {
                setError(`${successCount}명 반려 완료, ${failCount}명 실패했습니다.`);
            }
            await fetchPendingUsers(pagination.page, searchTerm, filters);
        }
        catch (err: any) {
            setError(err.response?.data?.message ||
                "일괄 반려 중 오류가 발생했습니다.");
            setBulkRejectProgress(null);
        }
        finally {
            setProcessing(false);
        }
    };
    const handleRejectConfirm = async (category: string, reason: string) => {
        if (!currentRejectUserId)
            return;
        try {
            setProcessing(true);
            setRejectModalOpen(false);
            await AdminService.userReview.rejectUser(currentRejectUserId, category, reason);
            // 선택된 사용자가 거절된 경우 선택 해제
            if (selectedUser?.userId === currentRejectUserId ||
                selectedUser?.id === currentRejectUserId) {
                setSelectedUser(null);
            }
            setCurrentRejectUserId(null);
            await fetchPendingUsers(pagination.page, searchTerm, filters);
        }
        catch (err: any) {
            setError(err.response?.data?.message || "유저 반려 중 오류가 발생했습니다.");
        }
        finally {
            setProcessing(false);
        }
    };
    if (loading && activeTab === 0) {
        return (<div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <Spinner size="sm"></Spinner>
        <p style={{ marginLeft: 16 }}>심사 대기 목록을 불러오는 중...</p>
      </div>);
    }
    return (<div style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 16 }} className="text-2xl font-bold">프로필 이미지 심사</h1>

      <Tabs aria-label="프로필 이미지 심사 탭" style={{ marginBottom: 8 }} selectedKey={activeTab} onSelectionChange={newValue => setActiveTab(Number(newValue))}><Tabs.List aria-label="관리 항목">
        <Tabs.Tab id={0}>{"적격 심사"}<Tabs.Indicator></Tabs.Indicator></Tabs.Tab>
        <Tabs.Tab id={1}>{"이력 보기"}<Tabs.Indicator></Tabs.Indicator></Tabs.Tab>
      </Tabs.List></Tabs>

      <TabPanel value={activeTab} index={0}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div></div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* 건너뛴 유저 복원 버튼 */}
          {skippedUsers.length > 0 && (<span title={`건너뛴 ${skippedUsers.length}명 복원`}>
              <Button onPress={handleClearAllSkipped} variant="secondary" aria-label={`건너뛴 ${skippedUsers.length}명 복원`}>{<RefreshIcon></RefreshIcon>}
                건너뛴 {skippedUsers.length}명
              </Button>
            </span>)}

          {/* 필터 버튼 */}
          <span title={"필터"}>
            <Button onPress={() => setFilterExpanded(!filterExpanded)} variant="tertiary" isIconOnly={true} aria-label={"필터"}>
              <span className="inline-flex items-center gap-1">
                <FilterListIcon></FilterListIcon>
              <span>{getActiveFilterCount()}</span></span>
            </Button>
          </span>

          {/* 검색 */}
          <div hidden={!searchExpanded}>
            <div onSubmit={handleSearchSubmit} style={{ display: "flex", alignItems: "center", marginRight: 8 }}>
              <TextField className="mb-4"><Input aria-label="회원 검색" placeholder="이름, 전화번호, 이메일 검색" value={localSearchTerm} onChange={(e) => setLocalSearchTerm(e.target.value)} autoFocus></Input></TextField>
            </div>
          </div>
          <span title={searchExpanded ? "검색 닫기" : "검색"}>
            <Button onPress={handleSearchToggle} variant="tertiary" isIconOnly={true} aria-label={searchExpanded ? "검색 닫기" : "검색"}>
              <SearchIcon></SearchIcon>
            </Button>
          </span>
        </div>
      </div>

      {/* 일괄 반려 버튼 */}
      {selectedUserIds.length > 0 && (<div style={{ marginBottom: 16 }}>
          <Button onPress={handleBulkReject} isDisabled={processing} variant="primary">
            선택된 {selectedUserIds.length}명 일괄 반려
          </Button>
        </div>)}

      {/* 진행 상태 표시 */}
      {bulkRejectProgress && (<div style={{ marginBottom: 16 }}>
          <p style={{ marginBottom: 8 }}>
            반려 진행 중: {bulkRejectProgress.current} / {bulkRejectProgress.total}
          </p>
          <progress value={(bulkRejectProgress.current / bulkRejectProgress.total) * 100} aria-label="처리 중"></progress>
        </div>)}

      {/* 필터 패널 */}
      <div hidden={!filterExpanded}>
        <div style={{ marginBottom: 16, padding: 16, backgroundColor: "#f5f5f5", borderRadius: 2, display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
          {/* 성별 필터 */}
          <div style={{ minWidth: 100 }}>
            <label>성별</label>
            <Select value={filters.gender || ""} aria-label={"성별"} onChange={(key) => {
            const value = String(key ?? "");
            handleFilterChange("gender", value);
        }} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
              <ListBox.Item id={""} textValue={"\uC804\uCCB4"}>전체</ListBox.Item>
              <ListBox.Item id={"MALE"} textValue={"\uB0A8\uC131"}>남성</ListBox.Item>
              <ListBox.Item id={"FEMALE"} textValue={"\uC5EC\uC131"}>여성</ListBox.Item>
            </ListBox></Select.Popover></Select>
          </div>

          {/* 나이 필터 */}
          <TextField className="mb-4"><Label>{"최소 나이"}</Label><Input type="number" value={filters.minAge || ""} onChange={(e) => handleFilterChange("minAge", e.target.value ? Number(e.target.value) : undefined)}></Input></TextField>
          <p>
            ~
          </p>
          <TextField className="mb-4"><Label>{"최대 나이"}</Label><Input type="number" value={filters.maxAge || ""} onChange={(e) => handleFilterChange("maxAge", e.target.value ? Number(e.target.value) : undefined)}></Input></TextField>

          {/* 지역 필터 */}
          <div style={{ minWidth: 120 }}>
            <label>지역</label>
            <Select value={filters.region || ""} aria-label={"지역"} onChange={(key) => {
            const value = String(key ?? "");
            handleFilterChange("region", value);
        }} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
              <ListBox.Item id={""} textValue={"\uC804\uCCB4"}>전체</ListBox.Item>
              {REGION_OPTIONS.map((region) => (<ListBox.Item key={region.value} id={region.value} textValue={String(region.label)}>
                  {region.label}
                </ListBox.Item>))}
            </ListBox></Select.Popover></Select>
          </div>

          {/* 필터 적용/초기화 버튼 */}
          <Button onPress={handleApplyFilters} variant="primary" style={{ height: 40 }}>
            적용
          </Button>
          {getActiveFilterCount() > 0 && (<Button onPress={handleClearFilters} variant="secondary" style={{ height: 40 }}>
              초기화
            </Button>)}

          {/* 현재 적용된 필터 표시 */}
          {getActiveFilterCount() > 0 && (<div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginLeft: 8 }}>
              {filters.gender && (<Chip size="sm">{`성별: ${filters.gender === "MALE" ? "남성" : "여성"}`}<Button isIconOnly={true} variant="tertiary" aria-label="선택 해제" onPress={() => handleFilterChange("gender", undefined)}>×</Button></Chip>)}
              {filters.minAge && (<Chip size="sm">{`최소: ${filters.minAge}세`}<Button isIconOnly={true} variant="tertiary" aria-label="선택 해제" onPress={() => handleFilterChange("minAge", undefined)}>×</Button></Chip>)}
              {filters.maxAge && (<Chip size="sm">{`최대: ${filters.maxAge}세`}<Button isIconOnly={true} variant="tertiary" aria-label="선택 해제" onPress={() => handleFilterChange("maxAge", undefined)}>×</Button></Chip>)}
              {filters.region && (<Chip size="sm">{`지역: ${getIndividualRegionLabel(filters.region)}`}<Button isIconOnly={true} variant="tertiary" aria-label="선택 해제" onPress={() => handleFilterChange("region", undefined)}>×</Button></Chip>)}
            </div>)}
        </div>
      </div>

      {error && (<aside role="alert" className="rounded-lg border p-3" style={{ marginBottom: 16 }}>
          {error}
        </aside>)}

      <div className="flex flex-col gap-4 lg:h-[calc(100vh-200px)] lg:flex-row">
        {/* 좌: 유저 테이블 (40%) */}
        <div className="min-w-0 overflow-auto lg:basis-2/5 lg:shrink-0">
          <UserTableList users={users} selectedUser={selectedUser} onUserSelect={handleUserSelect} onSkipUser={handleSkipUser} pagination={pagination} onPageChange={(page) => fetchPendingUsers(page, searchTerm, filters)} searchTerm={searchTerm} selectedUserIds={selectedUserIds} onUserCheck={handleUserCheck} onSelectAllCheck={handleSelectAllCheck}></UserTableList>
        </div>

        {/* 우: 심사 패널 (60%) */}
        <div className="min-w-0 flex-1 overflow-auto">
          <ImageReviewPanel user={selectedUser} onApprove={handleApproveUser} onReject={handleRejectUser} onImageApproved={handleImageApproved} onImageRejected={handleImageRejected} processing={processing} setProcessing={setProcessing}></ImageReviewPanel>
        </div>
      </div>

      <RejectReasonModal open={rejectModalOpen} onClose={() => {
            setRejectModalOpen(false);
            setCurrentRejectUserId(null);
        }} onConfirm={handleRejectConfirm}></RejectReasonModal>

      <RejectReasonModal open={bulkRejectModalOpen} onClose={() => {
            setBulkRejectModalOpen(false);
        }} onConfirm={handleBulkRejectConfirm} count={selectedUserIds.length}></RejectReasonModal>

      <Modal.Backdrop isOpen={processing} isDismissable={false} isKeyboardDismissDisabled><Modal.Container size="lg"><Modal.Dialog aria-label="프로필 이미지 처리 중" style={{ width: '100%', maxWidth: 600, minWidth: 0 }}><Modal.Body>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, backgroundColor: "white", borderRadius: 2, minWidth: 200 }}>
          <Spinner size="sm"></Spinner>
          <p style={{ marginTop: 16, fontWeight: 600 }}>
            처리 중입니다...
          </p>
        </div>
      </Modal.Body></Modal.Dialog></Modal.Container></Modal.Backdrop>
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <ReviewHistoryTab></ReviewHistoryTab>
      </TabPanel>
    </div>);
}
export default function ProfileReviewV2() {
    return <ProfileReviewV2Content></ProfileReviewV2Content>;
}
